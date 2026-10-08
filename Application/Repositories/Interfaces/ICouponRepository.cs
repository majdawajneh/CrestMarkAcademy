using Domain.Entities.Commerce;

namespace Application.Repositories.Interfaces
{
    public interface ICouponRepository
    {
        Task<IEnumerable<Coupon>>
            GetAllWithCoursesAsync();

        Task<Coupon?>
            GetByIdWithCoursesAsync(int id);

        Task<Coupon?>
            GetByCodeWithCoursesAsync(string code);
    }
}