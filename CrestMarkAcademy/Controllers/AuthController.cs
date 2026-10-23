
using Application.Dto_s.Auth;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ========================================
        // Current User
        // ========================================

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            var userId = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            var username = User.FindFirstValue(
                ClaimTypes.Name
            );

            var email = User.FindFirstValue(
                ClaimTypes.Email
            );

            var roles = User.FindAll(
                ClaimTypes.Role
            )
            .Select(r => r.Value)
            .ToList();

            return Ok(new
            {
                UserId = userId,
                Username = username,
                Email = email,
                Roles = roles
            });
        }

        // ========================================
        // Admin Test
        // ========================================

        [Authorize(Roles = "Admin")]
        [HttpGet("admin-test")]
        public IActionResult AdminTest()
        {
            return Ok(new
            {
                Message = "Welcome Admin"
            });
        }

        // ========================================
        // Register
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-register")]
        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponseDto>>
            Register(RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);

            return Ok(result);
        }

        // ========================================
        // Login
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-login")]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>>
            Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            return Ok(result);
        }

        // ========================================
        // Refresh Token
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-refresh")]
        [HttpPost("refresh-token")]
        public async Task<ActionResult<AuthResponseDto>>
            RefreshToken(RefreshTokenDto dto)
        {
            var result = await _authService.RefreshTokenAsync(dto);

            return Ok(result);
        }

        // ========================================
        // Logout
        // ========================================

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(
            LogoutDto dto)
        {
            await _authService.LogoutAsync(dto);

            return NoContent();
        }

        // ========================================
        // Confirm Email
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-confirm")]
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(
            ConfirmEmailDto dto)
        {
            await _authService.ConfirmEmailAsync(dto);

            return Ok(new
            {
                Message = "Email confirmed successfully."
            });
        }

        // ========================================
        // Resend Confirmation Email
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-email")]
        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation(
            ResendConfirmationDto dto)
        {
            await _authService
                .ResendConfirmationEmailAsync(dto);

            return Ok(new
            {
                Message =
                    "If the account exists and the email is not confirmed, a new confirmation email has been sent."
            });
        }

        // ========================================
        // Forgot Password
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-email")]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            ForgotPasswordDto dto)
        {
            await _authService.ForgotPasswordAsync(dto);

            return Ok(new
            {
                Message =
                    "If an account exists with this email, a password reset link has been sent."
            });
        }

        // ========================================
        // Reset Password
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-token")]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            ResetPasswordDto dto)
        {
            await _authService.ResetPasswordAsync(dto);

            return Ok(new
            {
                Message =
                    "Password reset successfully. Please log in with your new password."
            });
        }

        // ========================================
        // Change Password
        // ========================================

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(
            ChangePasswordDto dto)
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            await _authService.ChangePasswordAsync(
                userId,
                dto
            );

            return Ok(new
            {
                Message = "Password changed successfully."
            });
        }

        // ========================================
        // Accept Instructor Invitation
        // ========================================

        [AllowAnonymous]
        [EnableRateLimiting("auth-token")]
        [HttpPost("instructor-invitation/accept")]
        public async Task<IActionResult>
            AcceptInstructorInvitation(
                [FromBody] AcceptInstructorInvitationDto dto)
        {
            await _authService
                .AcceptInstructorInvitationAsync(dto);

            return Ok(new
            {
                message =
                    "Instructor account activated successfully."
            });
        }
    }
}
