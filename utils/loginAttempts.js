//helper function to handle login attempts
// This function increments the login attempts and sets a lockout time if necessary
const handleLoginAttempts = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loginAttempts: true,
      },
    });

    if (user) {
      const attempts = (user.loginAttempts || 0) + 1; // Increment login attempts
      const lockoutUntil =
        attempts >= 5 ? new Date(Date.now() + 10 * 60 * 1000) : null; // Lockout for 10 minutes after 5 failed attempts

      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: attempts,
          lockoutUntil,
        },
      });
    }
  } catch (error) {
    console.error("Error handling login attempts:", error);
    // Don't throw - login should still fail gracefully
  }
};
module.exports = { handleLoginAttempts };
