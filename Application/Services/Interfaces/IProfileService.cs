using Application.Dto_s.Profile;

namespace Application.Services.Interfaces
{
    public interface IProfileService
    {
        Task<ProfileDto>
            GetMyProfileAsync(
                int userId
            );

        Task<ProfileDto>
            UpdateMyProfileAsync(
                int userId,
                UpdateProfileDto dto
            );
    }
}