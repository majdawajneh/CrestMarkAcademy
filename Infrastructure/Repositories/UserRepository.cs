using Application.Repositories.Interfaces;
using Domain.Entities.Identity;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class UserRepository
        : IUserRepository
    {
        private readonly CrestMark_DbContext
            _dbContext;


        public UserRepository(
            CrestMark_DbContext dbContext)
        {
            _dbContext =
                dbContext;
        }


        // =========================
        // Get All Users
        // =========================

        public async Task<IEnumerable<User>>
            GetAllWithDetailsAsync()
        {
            return await _dbContext.Users

                .Include(u => u.UserProfile)

                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)

                .OrderByDescending(
                    u => u.CreatedAt
                )

                .ToListAsync();
        }


        // =========================
        // Get User By Id
        // =========================

        public async Task<User?>
            GetByIdWithDetailsAsync(
                int id)
        {
            return await _dbContext.Users

                .Include(u => u.UserProfile)

                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)

                .FirstOrDefaultAsync(
                    u => u.Id == id
                );
        }
    }
}