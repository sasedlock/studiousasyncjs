const delayms = 1;

function getCurrentCity(callback) { // note the callback passed INTO this method
  setTimeout(function () {

    const city = "New York, NY";
    callback(null, city); // and this same callback called with a new variable

  }, delayms)
}

function getWeather(city, callback) {
  setTimeout(function () {

    if (!city) {
      callback(new Error("City required to get weather"));
      return;
    }

    const weather = {
      temp: 50
    };

    callback(null, weather)

  }, delayms)
}

function getForecast(city, callback) {
  setTimeout(function () {

    if (!city) {
      callback(new Error("City required to get forecast"));
      return;
    }

    const fiveDay = {
      fiveDay: [60, 70, 80, 45, 50]
    };

    callback(null, fiveDay)

  }, delayms)
}

suite.only("operations");

function fetchCurrentCity1(success, error, data) {
  setTimeout(function() {
    if (!data) { // if method did not receive data
      error(); // then call the provided error callback
      return;
    } else { // otherwise
      success(); // call the provided success method!
      return;
    }
  }, delayms);
}

function fetchCurrentCity2() {
  const operation = {}; // define some operation 

  operation.onCompletion = function(s, e) { // define a method that can set a success and error method on the associated operation object
    operation.success = s;
    operation.error = e;
  }
  
  setTimeout(function() { // while the setTimeout method is called, the method inside WILL NOT RUN IMMEDIATELY
    if(operation.success) {
      operation.success();
    }
  }, delayms);

  return operation; // return the operation object
}

function fetchCurrentCity() {
  const operation = new Operation();  
  
  getCurrentCity(operation.nodeCallback);

  return operation;
}

function fetchForecast(city) {
  const operation = new Operation();

  getForecast(city, operation.nodeCallback);

  return operation;
}

function fetchWeather(city) {
  const operation = new Operation();

  getWeather(city, operation.nodeCallback);

  return operation;
}

function Operation() {
  const operation = {
    success: [],
    failure: []
  };

  operation.nodeCallback = function(error, result) {
    if (error) {
      operation.fail(error);
      return;
    }

    operation.succeed(result);
  }

  operation.fail = function(e) {
    operation.state = "failed";
    operation.error = e;
    operation.failure.forEach(r => r(e));
  }

  operation.succeed = function(result) {
    operation.state = "succeeded";
    operation.result = result;
    operation.success.forEach(r => r(result));
  } 

  operation.onCompletion = function(s,e) {
    const noop = function() {};
    
    if (operation.state === "succeeded") {
      s(operation.result);
    } else if (operation.state === "failed") {
      e(operation.error);
    } else {
      operation.success.push(s || noop);
      operation.failure.push(e || noop);
    }
  }

  operation.onSuccess = function(s) {
    operation.onCompletion(s);
  }

  operation.onFailure = function(e) {
    operation.onCompletion(null,e);
  }

  return operation;
}

function doLater(func) {
  setTimeout(func, 1);
};

test("register failure callback async", function(done){
  var operationThatFails = fetchWeather();

  doLater(function() {
    operationThatFails.onFailure(()=>done());
  })
});

test("register success callback async", function(done){
  var operationThatSucceeds = fetchCurrentCity();

  doLater(function() {
    operationThatSucceeds.onCompletion(()=>done());
  })
});

test("noop if no success handler passed", function(done) {
  const operation = fetchCurrentCity();

  operation.onFailure(error => done(error));
  operation.onCompletion(result => done());
});

test("noop if no error handler passed", function(done) {
  const operation = fetchCurrentCity();

  operation.onCompletion(result => done());
  operation.onFailure(error => done(error));
});

test("fetchCurrentCity runs all callbacks", function(done) {
  var operation = fetchCurrentCity();

  const multiDone = callDone(done).afterFiveCalls();

  operation.onSuccess(result => multiDone());
  operation.onSuccess(result => multiDone());
  operation.onSuccess(result => multiDone());
  operation.onSuccess(result => multiDone());
  operation.onSuccess(result => multiDone());
});

test("fetchCurrentCity1 runs error callback when no data is passed", function(done) {
  function s() {
    console.log("success!!!");
  }
  
  function e() {
    console.log("sad trombone");
    done();
  }

  fetchCurrentCity1(s,e,null);
});

test("fetchCurrentCity1 runs success callback when data is passed", function(done) {
  function s() {
      console.log("success!!!");
      done();
  }
  
  function e() {
    console.log("sad trombone");
  }

  fetchCurrentCity1(s,e,"not null");
});

test("fetchCurrentCity2 runs success", function(done) {
  var operation = fetchCurrentCity2();
  operation.onCompletion(
    result => done(),
    error => done(error)
  );
});