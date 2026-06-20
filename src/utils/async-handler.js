const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export { asyncHandler }

/*
async-handler.js (The Try-Catch Eliminator)

This is arguably the most helpful file of the three. When writing modern JavaScript, you
 often deal with "Promises" (asynchronous code, like asking a database for information).

The Problem: To prevent your server from crashing if a database request fails, you normally
 have to wrap your code in a try { ... } catch (error) { ... } block. Doing this for every
  single route in your application is tedious and makes the code look bulky.

The Solution: asyncHandler is a clever wrapper. You wrap your route logic inside it,
 and it automatically handles the catch part for you in the background. If any error
  happens, it quietly catches it and passes it to Express's error-handling system (next(err)).
*/