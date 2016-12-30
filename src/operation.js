const delayms = 1;

function getCurrentCity(callback) {
  setTimeout(function () {

    const city = "New York, NY";
    callback(null, city);

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
    if (!data) {
      error();
      return;
    } else {
      success();
      return;
    }
  }, delayms);
}

function fetchCurrentCity2() {
  const operation = {};

  operation.onCompletion = function(s, e) {
    operation.success = s;
    operation.error = e;
  }
  
  setTimeout(function() {
    if(operation.success) {
      operation.success();
    }
  }, delayms);

  return operation;
}

function fetchCurrentCity() {
  const operation = new Operation();  
  
  getCurrentCity(operation.nodeCallback);

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

  let operationState = 'pending';

  operation.nodeCallback = function(error, result) {
    if (error) {
      operation.fail(error);
      return;
    }

    operation.succeed(result);
  }

  operation.fail = function(e) {
    operation.operationState = 'failed';
    operation.error = e; 
    operation.failure.forEach(r => r(e));
  }

  operation.succeed = function(result) {
    operation.operationState = 'succeeded';
    operation.result = result;
    operation.success.forEach(r => r(result));
  } 

  operation.onCompletion = function(s,e) {
    const noop = function() {};
    operation.success.push(s || noop);
    operation.failure.push(e || noop);
    if (operation.operationState === 'succeeded') {
      s(operation.result);
    } else if (operation.operationState === 'failed') {
      e(operation.error);
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
}

test("register success callback async", function(done) {
  var operationThatSucceeds = fetchCurrentCity(); // create the operation, or promise

  doLater(function() {
    operationThatSucceeds.onCompletion(() => done());
  });
});

test("register failure callback async", function(done) {
  var operationThatFails = fetchWeather();

  doLater(function() {
    operationThatFails.onFailure(() => done());
  });
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