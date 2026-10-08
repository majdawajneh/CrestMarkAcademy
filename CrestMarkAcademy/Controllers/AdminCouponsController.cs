using Application.Dto_s.Coupon;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/coupons")]
    [Authorize(Roles = "Admin")]
    public class AdminCouponsController
        : ControllerBase
    {
        private readonly ICouponService
            _couponService;


        public AdminCouponsController(
            ICouponService couponService)
        {
            _couponService =
                couponService;
        }


        // =========================
        // Get All
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CouponDto>>>
            GetAll()
        {
            var coupons =
                await _couponService
                    .GetAllAsync();


            return Ok(coupons);
        }


        // =========================
        // Get By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CouponDto>>
            GetById(int id)
        {
            var coupon =
                await _couponService
                    .GetByIdAsync(id);


            return Ok(coupon);
        }


        // =========================
        // Create
        // =========================

        [HttpPost]
        public async Task<ActionResult<CouponDto>>
            Create(
                CreateCouponDto dto)
        {
            var coupon =
                await _couponService
                    .CreateAsync(dto);


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = coupon.Id
                },
                coupon
            );
        }


        // =========================
        // Update
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CouponDto>>
            Update(
                int id,
                UpdateCouponDto dto)
        {
            var coupon =
                await _couponService
                    .UpdateAsync(
                        id,
                        dto
                    );


            return Ok(coupon);
        }


        // =========================
        // Deactivate
        // =========================

        [HttpPatch("{id:int}/deactivate")]
        public async Task<IActionResult>
            Deactivate(int id)
        {
            await _couponService
                .DeactivateAsync(id);


            return NoContent();
        }


        // =========================
        // Activate
        // =========================

        [HttpPatch("{id:int}/activate")]
        public async Task<IActionResult>
            Activate(int id)
        {
            await _couponService
                .ActivateAsync(id);


            return NoContent();
        }
    }
}