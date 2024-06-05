// USING PROMISE

const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };

// explanation below code
// const asyncHandler = () => {};
// const asyncHandler = (fn) => {async() => {}}  means function ko further ek aur  fraction mein pass kar diya
// bas {}  nahi hoga

// THIS IS TRY CATCH !
// const asyncHandler = async (fn) => async (req, res, next) => {
//   try {
//   } catch (error) {
//     await fn(req, res, next);
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
