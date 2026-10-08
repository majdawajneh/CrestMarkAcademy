using Domain.Entities.Identity;

namespace Application.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>>
            GetAllWithDetailsAsync();

        Task<User?>
            GetByIdWithDetailsAsync(
                int id
            );
    }
}