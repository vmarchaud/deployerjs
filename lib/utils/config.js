
// declared internal reporters and strategies
module.exports = {
  reporters : {
    STD: require('../reporters/StdReporter'),
    SPINNER : require('../reporters/SpinnerReporter')
  },
  strategies : {
    GIT: require('../strategies/GitStrategy')
  }
}