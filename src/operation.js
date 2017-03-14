const delayms = 1;
const defaultCity = "Houston, TX";
const defaultForecast = {
      fiveDay: [60, 70, 80, 45, 50]
    };

function getCurrentCity(callback) {
  setTimeout(function () {

    const city = defaultCity;
    callback(null, city);

  }, delayms)
}

function getWeather(city, callback) {
  //console.log('getting weather');
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
  //console.log('getting forecast');
  setTimeout(function () {

    if (!city) {
      callback(new Error("City required to get forecast"));
      return;
    }

    callback(null, defaultForecast);

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

function fetchForecast(city) {
  const operation = new Operation();

  getForecast(city, operation.nodeCallback);

  return operation;
}

function Operation() {
  const operation = {
    success: [],
    failure: []
  };

  operation.operationState = 'pending';

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
    operation.failure.forEach(f => f(e));
  }

  operation.succeed = function(result) {
    operation.operationState = 'succeeded';
    operation.result = result;
    operation.success.forEach(s => s(result));
  } 

  operation.onCompletion = function(s,e) {
    const noop = function() {};
    const proxyOp = new Operation();

    function successHandler() {
      if (s) {
        const callbackResult = s(operation.result);
        if (callbackResult && callbackResult.then) {
          callbackResult.forwardCompletion(proxyOp);
        }
      } else {
        proxyOp.succeed(operation.result);
      }
    }

    function errorHandler() {
      if (e) {
        const callbackError = e(operation.error);
        if (callbackError && callbackError.then) {
          callbackError.forwardCompletion(proxyOp);
          return;
        }
        proxyOp.succeed(callbackError);
      } else {
        proxyOp.fail(operation.error);
      }
    }

    if (operation.operationState === 'pending'){
      operation.success.push(successHandler);
      operation.failure.push(errorHandler);
    } else if (operation.operationState === 'succeeded') {
      successHandler();
    } else if (operation.operationState === 'failed') {
      errorHandler();
    }

    return proxyOp;
  }

  operation.onSuccess = function(s) {
    return operation.onCompletion(s);
  }

  operation.onFailure = function(e) {
    return operation.onCompletion(null,e);
  }

  operation.forwardCompletion = function(op) {
    return operation.onCompletion(op.succeed, op.fail);
  }
  
  operation.then = operation.onCompletion;

  operation.catch = operation.onFailure;

  return operation;
}

function doLater(func) {
  setTimeout(func, 1);
}

function fetchCurrentCityThatFails() {
  var operation = new Operation();
  doLater(() => operation.fail(new Error("GPS broken")));
  return operation;
}

test("sync error recovery", function(done) {
  fetchCurrentCityThatFails()
    .catch(function(){
    return defaultCity;       
    })     
    .then(function(city) {
      expect(city).toBe(defaultCity);
      done();
    });
});

test("async error recovery", function(done) {
  fetchCurrentCityThatFails()
    .catch(function(){
      return fetchCurrentCity();
    })     
    .then(function(city) {
      expect(city).toBe(defaultCity);
      done();
    });
});

test("error recovery bypassed if not needed", function(done){
  fetchCurrentCity()
    .catch(error => defaultCity)
    .then(function(city) {
      expect(city).toBe(defaultCity);
      done();
    })
})

test("error fallthrough", function(done){
  fetchCurrentCityThatFails()
    .then(function(city) {
      return fetchForecast(city);
    })
    .then(function(forecast) {
      expect(forecast).toBe(defaultForecast);
    })
    .catch(function(error) {
      done();
    });
})

test("life is full of async, nesting is inevitable, let's do something about errors", function(done){
  fetchCurrentCity()
    .then(city => fetchWeather())
      .then(null, done());
});

test("life is full of async, nesting is inevitable, let's do something about it", function(done){
  fetchCurrentCity()
    .then(city => fetchWeather(city))
    .then(weather => done());
});

test("lexical parallelism", function(done){
  const city = "NYC";
  console.log('before fireing off requests');
  const weatherOp = fetchWeather(city); // fire off request for the weather
  const forecastOp = fetchForecast(city); // fire off request for the forecast
  console.log('requests have completed');

  forecastOp.onCompletion(function(forecast) { // register function to run after weather has been fetched
    weatherOp.onCompletion(function(weather) { // register function to run after forecast has been fetched
      // once we have both the forecast and the weather, then do something
      console.log(`It's currently ${weather.temp} in ${city} with a five day forecast of ${forecast.fiveDay}!`);
      done();
    })
  })
});

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