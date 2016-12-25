
// declared internal reporters and strategies
module.exports = {
  reporters: {
    STD: require('../reporters/StdReporter'),
    SPINNER: require('../reporters/SpinnerReporter'),
    VOID: require('../reporters/VoidReporter')
  },
  strategies: {
    GIT: require('../strategies/GitStrategy')
  },
  rollback: 1
}
