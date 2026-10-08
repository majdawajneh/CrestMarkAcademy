using Application.Dto_s.Coupon;

namespace Application.Services.Interfaces
{
    public interface ICouponService
    {
        Task<IEnumerable<CouponDto>>
            GetAllAsync();

        Task<CouponDto>
            GetByIdAsync(int id);

        Task<CouponDto>
            CreateAsync(CreateCouponDto dto);

        Task<CouponDto>
            UpdateAsync(
                int id,
                UpdateCouponDto dto
            );

        Task DeactivateAsync(int id);

        Task ActivateAsync(int id);
    }
}