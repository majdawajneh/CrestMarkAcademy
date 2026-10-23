using Application.Dto_s.Auth;

namespace Application.Services.Interfaces
{
    public interface IAuthService
    {
        Task<RegisterResponseDto> RegisterAsync(RegisterDto dto);

        Task<AuthResponseDto> LoginAsync(LoginDto dto);

        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto);

        Task LogoutAsync(LogoutDto dto);

        Task ConfirmEmailAsync(ConfirmEmailDto dto);
        Task ResendConfirmationEmailAsync(ResendConfirmationDto dto);
        Task ForgotPasswordAsync(ForgotPasswordDto dto);
        Task ResetPasswordAsync(ResetPasswordDto dto);
        Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
        Task AcceptInstructorInvitationAsync(AcceptInstructorInvitationDto dto);
    }
}