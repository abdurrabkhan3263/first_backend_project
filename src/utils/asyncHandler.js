// USING PROMISE

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
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
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
