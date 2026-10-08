using Application.Repositories.Interfaces;
using Domain.Entities.Commerce;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CouponRepository : ICouponRepository
    {
        private readonly CrestMark_DbContext _dbContext;

        public CouponRepository(
            CrestMark_DbContext dbContext)
        {
            _dbContext = dbContext;
        }


        public async Task<IEnumerable<Coupon>>
            GetAllWithCoursesAsync()
        {
            return await _dbContext.Coupons
                .Include(c => c.CouponCourses)
                .OrderByDescending(c => c.Id)
                .ToListAsync();
        }


        public async Task<Coupon?>
            GetByIdWithCoursesAsync(int id)
        {
            return await _dbContext.Coupons
                .Include(c => c.CouponCourses)
                .FirstOrDefaultAsync(
                    c => c.Id == id
                );
        }


        public async Task<Coupon?>
            GetByCodeWithCoursesAsync(
                string code)
        {
            return await _dbContext.Coupons
                .Include(c => c.CouponCourses)
                .FirstOrDefaultAsync(
                    c => c.Code == code
                );
        }
    }
}