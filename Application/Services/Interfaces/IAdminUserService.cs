using Application.Dto_s.User;

namespace Application.Services.Interfaces
{
    public interface IAdminUserService
    {
        Task<IEnumerable<AdminUserListDto>>
            GetAllAsync();

        Task<AdminUserDetailsDto>
            GetByIdAsync(
                int id
            );

        Task DeactivateAsync(
            int currentAdminUserId,
            int userId
        );

        Task ActivateAsync(
            int userId
        );
    }
}