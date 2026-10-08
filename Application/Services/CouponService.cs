using Application.Dto_s.Coupon;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Commerce;

namespace Application.Services
{
    public class CouponService : ICouponService
    {
        private readonly IGenericRepository<Coupon>
            _couponRepo;

        private readonly IGenericRepository<CouponCourse>
            _couponCourseRepo;

        private readonly IGenericRepository<Course>
            _courseRepo;

        private readonly ICouponRepository
            _couponDetailsRepo;


        public CouponService(
            IGenericRepository<Coupon> couponRepo,
            IGenericRepository<CouponCourse> couponCourseRepo,
            IGenericRepository<Course> courseRepo,
            ICouponRepository couponDetailsRepo)
        {
            _couponRepo = couponRepo;
            _couponCourseRepo = couponCourseRepo;
            _courseRepo = courseRepo;
            _couponDetailsRepo = couponDetailsRepo;
        }


        // =========================
        // Get All
        // =========================

        public async Task<IEnumerable<CouponDto>>
            GetAllAsync()
        {
            var coupons =
                await _couponDetailsRepo
                    .GetAllWithCoursesAsync();


            return coupons
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get By Id
        // =========================

        public async Task<CouponDto>
            GetByIdAsync(int id)
        {
            var coupon =
                await _couponDetailsRepo
                    .GetByIdWithCoursesAsync(id);


            if (coupon == null)
            {
                throw new KeyNotFoundException(
                    "Coupon was not found."
                );
            }


            return MapToDto(coupon);
        }


        // =========================
        // Create
        // =========================

        public async Task<CouponDto>
            CreateAsync(
                CreateCouponDto dto)
        {
            ValidateCouponData(
                dto.DiscountType,
                dto.DiscountValue,
                dto.StartDate,
                dto.EndDate,
                dto.UsageLimit
            );


            var code =
                NormalizeCode(dto.Code);


            var exists =
                await _couponRepo
                    .ExistsAsync(
                        c => c.Code == code
                    );


            if (exists)
            {
                throw new InvalidOperationException(
                    "Coupon code already exists."
                );
            }


            var courseIds =
                await ValidateCourseIdsAsync(
                    dto.CourseIds
                );


            var coupon =
                new Coupon
                {
                    Code = code,

                    DiscountType =
                        NormalizeDiscountType(
                            dto.DiscountType
                        ),

                    DiscountValue =
                        dto.DiscountValue,

                    StartDate =
                        dto.StartDate,

                    EndDate =
                        dto.EndDate,

                    UsageLimit =
                        dto.UsageLimit,

                    UsedCount = 0,

                    IsActive =
                        dto.IsActive
                };


            foreach (var courseId
                     in courseIds)
            {
                coupon.CouponCourses.Add(
                    new CouponCourse
                    {
                        CourseId = courseId
                    }
                );
            }


            await _couponRepo
                .AddAsync(coupon);


            await _couponRepo
                .SaveChangesAsync();


            var createdCoupon =
                await _couponDetailsRepo
                    .GetByIdWithCoursesAsync(
                        coupon.Id
                    );


            if (createdCoupon == null)
            {
                throw new InvalidOperationException(
                    "Coupon was created but could not be loaded."
                );
            }


            return MapToDto(
                createdCoupon
            );
        }


        // =========================
        // Update
        // =========================

        public async Task<CouponDto>
            UpdateAsync(
                int id,
                UpdateCouponDto dto)
        {
            var coupon =
                await _couponDetailsRepo
                    .GetByIdWithCoursesAsync(id);


            if (coupon == null)
            {
                throw new KeyNotFoundException(
                    "Coupon was not found."
                );
            }


            ValidateCouponData(
                dto.DiscountType,
                dto.DiscountValue,
                dto.StartDate,
                dto.EndDate,
                dto.UsageLimit
            );


            if (dto.UsageLimit.HasValue &&
                dto.UsageLimit.Value <
                coupon.UsedCount)
            {
                throw new InvalidOperationException(
                    "Usage limit cannot be less than the current used count."
                );
            }


            var code =
                NormalizeCode(dto.Code);


            var duplicate =
                await _couponRepo
                    .ExistsAsync(
                        c =>
                            c.Code == code
                            &&
                            c.Id != id
                    );


            if (duplicate)
            {
                throw new InvalidOperationException(
                    "Coupon code already exists."
                );
            }


            var newCourseIds =
                await ValidateCourseIdsAsync(
                    dto.CourseIds
                );


            coupon.Code =
                code;

            coupon.DiscountType =
                NormalizeDiscountType(
                    dto.DiscountType
                );

            coupon.DiscountValue =
                dto.DiscountValue;

            coupon.StartDate =
                dto.StartDate;

            coupon.EndDate =
                dto.EndDate;

            coupon.UsageLimit =
                dto.UsageLimit;

            coupon.IsActive =
                dto.IsActive;


            // =========================
            // Sync Course Relations
            // =========================

            var currentRelations =
                coupon.CouponCourses
                    .ToList();


            var currentCourseIds =
                currentRelations
                    .Select(
                        cc => cc.CourseId
                    )
                    .ToHashSet();


            var newCourseIdSet =
                newCourseIds
                    .ToHashSet();


            // Delete removed courses

            foreach (var relation
                     in currentRelations)
            {
                if (!newCourseIdSet
                        .Contains(
                            relation.CourseId
                        ))
                {
                    _couponCourseRepo
                        .Delete(relation);
                }
            }


            // Add new courses

            foreach (var courseId
                     in newCourseIds)
            {
                if (!currentCourseIds
                        .Contains(courseId))
                {
                    await _couponCourseRepo
                        .AddAsync(
                            new CouponCourse
                            {
                                CouponId = coupon.Id,
                                CourseId = courseId
                            }
                        );
                }
            }


            _couponRepo.Update(coupon);


            await _couponRepo
                .SaveChangesAsync();


            var updatedCoupon =
                await _couponDetailsRepo
                    .GetByIdWithCoursesAsync(
                        id
                    );


            if (updatedCoupon == null)
            {
                throw new InvalidOperationException(
                    "Coupon was updated but could not be loaded."
                );
            }


            return MapToDto(
                updatedCoupon
            );
        }


        // =========================
        // Deactivate
        // =========================

        public async Task
            DeactivateAsync(int id)
        {
            var coupon =
                await _couponRepo
                    .GetByIdAsync(id);


            if (coupon == null)
            {
                throw new KeyNotFoundException(
                    "Coupon was not found."
                );
            }


            coupon.IsActive = false;


            _couponRepo.Update(coupon);


            await _couponRepo
                .SaveChangesAsync();
        }


        // =========================
        // Activate
        // =========================

        public async Task
            ActivateAsync(int id)
        {
            var coupon =
                await _couponRepo
                    .GetByIdAsync(id);


            if (coupon == null)
            {
                throw new KeyNotFoundException(
                    "Coupon was not found."
                );
            }


            coupon.IsActive = true;


            _couponRepo.Update(coupon);


            await _couponRepo
                .SaveChangesAsync();
        }


        // =========================
        // Validate Course IDs
        // =========================

        private async Task<List<int>>
            ValidateCourseIdsAsync(
                List<int>? courseIds)
        {
            if (courseIds == null ||
                courseIds.Count == 0)
            {
                return new List<int>();
            }


            var distinctIds =
                courseIds
                    .Distinct()
                    .ToList();


            if (distinctIds.Any(
                    id => id <= 0))
            {
                throw new ArgumentException(
                    "Invalid course id."
                );
            }


            foreach (var courseId
                     in distinctIds)
            {
                var exists =
                    await _courseRepo
                        .ExistsAsync(
                            c =>
                                c.Id ==
                                courseId
                        );


                if (!exists)
                {
                    throw new KeyNotFoundException(
                        $"Course with id {courseId} was not found."
                    );
                }
            }


            return distinctIds;
        }


        // =========================
        // Coupon Validation
        // =========================

        private static void
            ValidateCouponData(
                string discountType,
                decimal discountValue,
                DateTime startDate,
                DateTime endDate,
                int? usageLimit)
        {
            var type =
                NormalizeDiscountType(
                    discountType
                );


            if (discountValue <= 0)
            {
                throw new ArgumentException(
                    "Discount value must be greater than zero."
                );
            }


            if (type == "Percentage" &&
                discountValue > 100)
            {
                throw new ArgumentException(
                    "Percentage discount cannot exceed 100%."
                );
            }


            if (startDate >= endDate)
            {
                throw new ArgumentException(
                    "End date must be after start date."
                );
            }


            if (usageLimit.HasValue &&
                usageLimit.Value <= 0)
            {
                throw new ArgumentException(
                    "Usage limit must be greater than zero."
                );
            }
        }


        // =========================
        // Normalize Type
        // =========================

        private static string
            NormalizeDiscountType(
                string discountType)
        {
            if (string.Equals(
                    discountType,
                    "Percentage",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Percentage";
            }


            if (string.Equals(
                    discountType,
                    "Fixed",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Fixed";
            }


            throw new ArgumentException(
                "Discount type must be Percentage or Fixed."
            );
        }


        // =========================
        // Normalize Code
        // =========================

        private static string NormalizeCode(
            string code)
        {
            if (string.IsNullOrWhiteSpace(
                    code))
            {
                throw new ArgumentException(
                    "Coupon code is required."
                );
            }


            return code
                .Trim()
                .ToUpperInvariant();
        }


        // =========================
        // Mapping
        // =========================

        private static CouponDto MapToDto(
            Coupon coupon)
        {
            var courseIds =
                coupon.CouponCourses
                    .Select(
                        cc => cc.CourseId
                    )
                    .OrderBy(id => id)
                    .ToList();


            return new CouponDto
            {
                Id =
                    coupon.Id,

                Code =
                    coupon.Code,

                DiscountType =
                    coupon.DiscountType,

                DiscountValue =
                    coupon.DiscountValue,

                StartDate =
                    coupon.StartDate,

                EndDate =
                    coupon.EndDate,

                UsageLimit =
                    coupon.UsageLimit,

                UsedCount =
                    coupon.UsedCount,

                IsActive =
                    coupon.IsActive,

                IsGlobal =
                    courseIds.Count == 0,

                CourseIds =
                    courseIds
            };
        }
    }
}