const CLOUD_FUNCTION_NAME = "lifeCycleSync"

function getCloudInitOptions(cloud) {
  const options = {
    traceUser: true
  }

  if (cloud && cloud.DYNAMIC_CURRENT_ENV) {
    options.env = cloud.DYNAMIC_CURRENT_ENV
  }

  return options
}

module.exports = {
  CLOUD_FUNCTION_NAME,
  getCloudInitOptions
}
