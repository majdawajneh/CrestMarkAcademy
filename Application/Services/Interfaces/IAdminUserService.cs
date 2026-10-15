
using Application.Dto_s.User;

namespace Application.Services.Interfaces
{
    public interface IAdminUserService
    {
        // Get all users
        Task<IEnumerable<AdminUserListDto>> GetAllAsync();

        // Get user details
        Task<AdminUserDetailsDto> GetByIdAsync(int id);

        // Activate / Deactivate user
        Task DeactivateAsync(
            int currentAdminUserId,
            int userId
        );

        Task ActivateAsync(int userId);

        // Instructor management
        Task AssignInstructorAsync(int userId);

        Task RemoveInstructorAsync(int userId);
    }
}
