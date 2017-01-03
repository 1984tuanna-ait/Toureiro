const Helper = require('./lib/helper');

const app = require('./lib/toureiro')({
  development: Helper.isDevelopmentEnvironment()
});
app.listen(3000, function() {
  console.log('Toureiro is now listening at port 3000...');
});
