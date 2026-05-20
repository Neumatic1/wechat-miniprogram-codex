const cloud = require("wx-server-sdk")
const nodemailer = require("nodemailer")

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const COLLECTION = "lifeCycleProfiles"
const FEEDBACK_COLLECTION = "lifeCycleFeedbacks"
const DEFAULT_FEEDBACK_NOTIFY_EMAIL = "1808438939@qq.com"

function sanitizeUserProfile(userProfile = {}) {
  return {
    nickName: typeof userProfile.nickName === "string" ? userProfile.nickName.trim().slice(0, 32) : "",
    avatarUrl: typeof userProfile.avatarUrl === "string" ? userProfile.avatarUrl.trim() : ""
  }
}

function hasProfileContent(userProfile = {}) {
  return !!(userProfile.nickName || userProfile.avatarUrl)
}

function normalizePayload(payload = {}) {
  const updatedAt =
    payload.updatedAt ||
    (payload.meta && payload.meta.updatedAt) ||
    new Date().toISOString()

  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    customTemplates: Array.isArray(payload.customTemplates) ? payload.customTemplates : [],
    customCategories: Array.isArray(payload.customCategories) ? payload.customCategories : [],
    unlockState: payload.unlockState && typeof payload.unlockState === "object" ? payload.unlockState : {},
    meta: {
      updatedAt
    },
    userProfile: sanitizeUserProfile(payload.userProfile),
    updatedAt,
    schemaVersion: Number(payload.schemaVersion) || 1
  }
}

function sanitizeFeedbackPayload(payload = {}) {
  const context = payload.context && typeof payload.context === "object" ? payload.context : {}

  return {
    type: payload.type === "suggestion" ? "suggestion" : "bug",
    message: typeof payload.message === "string" ? payload.message.trim().slice(0, 200) : "",
    screenshots: Array.isArray(payload.screenshots)
      ? payload.screenshots.filter((item) => typeof item === "string" && item.indexOf("cloud://") === 0).slice(0, 3)
      : [],
    context
  }
}

function getFeedbackMailConfig() {
  const smtpUser = (process.env.FEEDBACK_SMTP_USER || DEFAULT_FEEDBACK_NOTIFY_EMAIL).trim()
  const smtpPass = (process.env.FEEDBACK_SMTP_PASS || "").trim()
  const notifyEmail = (process.env.FEEDBACK_NOTIFY_EMAIL || DEFAULT_FEEDBACK_NOTIFY_EMAIL).trim()

  return {
    smtpUser,
    smtpPass,
    notifyEmail,
    enabled: !!(smtpUser && smtpPass && notifyEmail)
  }
}

function formatFeedbackType(type) {
  return type === "suggestion" ? "功能建议" : "问题反馈"
}

function formatProfileMode(mode) {
  return mode === "logged_in" ? "已登录" : "游客模式"
}

async function getScreenshotTempUrls(fileIds = []) {
  const filteredIds = fileIds.filter((fileId) => typeof fileId === "string" && fileId.indexOf("cloud://") === 0)
  if (!filteredIds.length) {
    return []
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: filteredIds
    })
    return Array.isArray(result.fileList)
      ? result.fileList.map((item) => item.tempFileURL).filter(Boolean)
      : []
  } catch (error) {
    return []
  }
}

function buildFeedbackMailText(feedback) {
  const screenshotSection = feedback.screenshotUrls.length
    ? feedback.screenshotUrls.map((url, index) => `截图 ${index + 1}：${url}`).join("\n")
    : "无截图"

  return [
    "生活物品周期管家收到一条新反馈",
    "",
    `反馈类型：${formatFeedbackType(feedback.type)}`,
    `反馈内容：${feedback.message}`,
    `提交时间：${feedback.createdAt}`,
    `反馈用户：${feedback.userProfile.nickName || "未提供昵称"}`,
    `账号状态：${formatProfileMode(feedback.context.profileMode)}`,
    `同步模式：${feedback.context.syncTitle || "未知"}`,
    `同步状态：${feedback.context.syncDetail || "未知"}`,
    `${feedback.context.lastSyncLabel || "最近一次同步成功"}：${feedback.context.lastSyncValue || "暂无"}`,
    `${feedback.context.pendingLabel || "未同步本地修改"}：${feedback.context.pendingValue || "未知"}`,
    feedback.context.pendingDetail ? `补充说明：${feedback.context.pendingDetail}` : "",
    `已管理物品：${feedback.context.managedCount || 0}`,
    `自定义模板：${feedback.context.customTemplateCount || 0}`,
    `设备平台：${feedback.context.device && feedback.context.device.platform ? feedback.context.device.platform : "unknown"}`,
    `设备型号：${feedback.context.device && feedback.context.device.model ? feedback.context.device.model : "未知"}`,
    `系统版本：${feedback.context.device && feedback.context.device.system ? feedback.context.device.system : "未知"}`,
    `微信版本：${feedback.context.device && feedback.context.device.version ? feedback.context.device.version : "未知"}`,
    "",
    "截图链接：",
    screenshotSection,
    "",
    `反馈记录ID：${feedback.feedbackId}`
  ].filter(Boolean).join("\n")
}

async function sendFeedbackNotification(feedback) {
  const mailConfig = getFeedbackMailConfig()
  if (!mailConfig.enabled) {
    return {
      ok: false,
      reason: "mail_disabled"
    }
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    auth: {
      user: mailConfig.smtpUser,
      pass: mailConfig.smtpPass
    }
  })

  await transporter.sendMail({
    from: `"生活物品周期管家" <${mailConfig.smtpUser}>`,
    to: mailConfig.notifyEmail,
    subject: `【生活物品周期管家】${formatFeedbackType(feedback.type)}`,
    text: buildFeedbackMailText(feedback)
  })

  return {
    ok: true,
    notifyEmail: mailConfig.notifyEmail
  }
}

async function getProfileDoc(openId) {
  try {
    const result = await db.collection(COLLECTION).doc(openId).get()
    return result.data || null
  } catch (error) {
    if (error && error.errCode === -1) {
      return null
    }
    throw error
  }
}

async function saveProfileDoc(openId, existingDoc, payload) {
  const now = new Date().toISOString()
  const mergedUserProfile = {
    ...(existingDoc && existingDoc.userProfile ? existingDoc.userProfile : {}),
    ...payload.userProfile
  }

  const nextDoc = {
    ...payload,
    userProfile: mergedUserProfile,
    updatedAt: payload.updatedAt,
    lastSyncAt: now,
    createdAt: existingDoc && existingDoc.createdAt ? existingDoc.createdAt : now
  }

  await db.collection(COLLECTION).doc(openId).set({
    data: nextDoc
  })

  return nextDoc
}

exports.main = async (event = {}) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()
  const action = event.action || ""

  if (!OPENID) {
    return { ok: false, reason: "missing_openid" }
  }

  if (action === "login") {
    const existingDoc = await getProfileDoc(OPENID)
    const userProfile = sanitizeUserProfile(event.userProfile)

    if (existingDoc && hasProfileContent(userProfile)) {
      await db.collection(COLLECTION).doc(OPENID).update({
        data: {
          userProfile: {
            ...(existingDoc.userProfile || {}),
            ...userProfile
          }
        }
      })
    }

    return {
      ok: true,
      found: !!existingDoc,
      openId: OPENID,
      appId: APPID,
      unionId: UNIONID || "",
      data: existingDoc
    }
  }

  if (action === "fetchProfile") {
    const profileDoc = await getProfileDoc(OPENID)
    return {
      ok: true,
      found: !!profileDoc,
      openId: OPENID,
      data: profileDoc
    }
  }

  if (action === "syncProfile") {
    const payload = normalizePayload(event.payload)
    const existingDoc = await getProfileDoc(OPENID)
    const profileDoc = await saveProfileDoc(OPENID, existingDoc, payload)

    return {
      ok: true,
      openId: OPENID,
      updatedAt: profileDoc.updatedAt,
      lastSyncAt: profileDoc.lastSyncAt
    }
  }

  if (action === "saveFeedback") {
    const payload = sanitizeFeedbackPayload(event.payload)
    if (!payload.message) {
      return {
        ok: false,
        reason: "empty_feedback"
      }
    }

    const now = new Date().toISOString()
    const existingDoc = await getProfileDoc(OPENID)

    const addResult = await db.collection(FEEDBACK_COLLECTION).add({
      data: {
        openId: OPENID,
        appId: APPID,
        unionId: UNIONID || "",
        type: payload.type,
        message: payload.message,
        screenshots: payload.screenshots,
        context: payload.context,
        userProfile: existingDoc && existingDoc.userProfile ? existingDoc.userProfile : {},
        createdAt: now,
        status: "new"
      }
    })

    const feedbackId = addResult && addResult._id ? addResult._id : ""
    const screenshotUrls = await getScreenshotTempUrls(payload.screenshots)
    let mailResult = {
      ok: false,
      reason: "mail_disabled"
    }

    try {
      mailResult = await sendFeedbackNotification({
        feedbackId,
        type: payload.type,
        message: payload.message,
        screenshots: payload.screenshots,
        screenshotUrls,
        context: payload.context,
        userProfile: existingDoc && existingDoc.userProfile ? existingDoc.userProfile : {},
        createdAt: now
      })
    } catch (error) {
      mailResult = {
        ok: false,
        reason: "mail_send_failed",
        errorMessage: error && (error.message || error.errMsg) ? (error.message || error.errMsg) : "unknown"
      }
    }

    await db.collection(FEEDBACK_COLLECTION).doc(feedbackId).update({
      data: {
        mailNotify: {
          ok: mailResult.ok,
          reason: mailResult.reason || "",
          notifyEmail: mailResult.notifyEmail || "",
          errorMessage: mailResult.errorMessage || "",
          attemptedAt: new Date().toISOString()
        }
      }
    })

    return {
      ok: true,
      feedbackId,
      mailNotify: {
        ok: mailResult.ok,
        reason: mailResult.reason || "",
        notifyEmail: mailResult.notifyEmail || ""
      }
    }
  }

  return {
    ok: false,
    reason: "unknown_action"
  }
}
