using Application.Dto_s.Wishlist;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Engagement;

namespace Application.Services
{
    public class WishlistService
        : IWishlistService
    {
        private readonly
            IGenericRepository<WishlistItem>
            _wishlistRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;


        public WishlistService(
            IGenericRepository<WishlistItem> wishlistRepo,
            IGenericRepository<Course> courseRepo)
        {
            _wishlistRepo =
                wishlistRepo;

            _courseRepo =
                courseRepo;
        }


        // =========================
        // Get My Wishlist
        // =========================

        public async Task<
            IEnumerable<WishlistItemDto>>
            GetMyWishlistAsync(
                int userId)
        {
            var items =
                (
                    await _wishlistRepo
                        .FindAsync(
                            w =>
                                w.UserId ==
                                userId
                        )
                )
                .OrderByDescending(
                    w => w.CreatedAt
                )
                .ToList();


            var result =
                new List<WishlistItemDto>();


            foreach (var item in items)
            {
                var course =
                    await _courseRepo
                        .GetByIdAsync(
                            item.CourseId
                        );


                if (course == null)
                {
                    continue;
                }


                result.Add(
                    MapToDto(
                        item,
                        course
                    )
                );
            }


            return result;
        }


        // =========================
        // Add
        // =========================

        public async Task<WishlistItemDto>
            AddAsync(
                int userId,
                int courseId)
        {
            var course =
                await _courseRepo
                    .GetByIdAsync(
                        courseId
                    );


            if (course == null)
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            if (!string.Equals(
                    course.Status,
                    "Published",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only published courses can be added to the wishlist."
                );
            }


            var existingItem =
                await _wishlistRepo
                    .FirstOrDefaultAsync(
                        w =>
                            w.UserId == userId
                            &&
                            w.CourseId ==
                            courseId
                    );


            // Idempotent

            if (existingItem != null)
            {
                return MapToDto(
                    existingItem,
                    course
                );
            }


            var item =
                new WishlistItem
                {
                    UserId =
                        userId,

                    CourseId =
                        courseId,

                    CreatedAt =
                        DateTime.UtcNow
                };


            await _wishlistRepo
                .AddAsync(item);


            await _wishlistRepo
                .SaveChangesAsync();


            return MapToDto(
                item,
                course
            );
        }


        // =========================
        // Remove
        // =========================

        public async Task RemoveAsync(
            int userId,
            int courseId)
        {
            var item =
                await _wishlistRepo
                    .FirstOrDefaultAsync(
                        w =>
                            w.UserId ==
                            userId
                            &&
                            w.CourseId ==
                            courseId
                    );


            if (item == null)
            {
                throw new KeyNotFoundException(
                    "Wishlist item was not found."
                );
            }


            _wishlistRepo.Delete(
                item
            );


            await _wishlistRepo
                .SaveChangesAsync();
        }


        // =========================
        // Mapping
        // =========================

        private static WishlistItemDto
            MapToDto(
                WishlistItem item,
                Course course)
        {
            return new WishlistItemDto
            {
                Id =
                    item.Id,

                CourseId =
                    course.Id,

                CourseTitle =
                    course.Title,

                CourseSlug =
                    course.Slug,

                ThumbnailUrl =
                    course.ThumbnailUrl,

                Price =
                    course.Price,

                DiscountPrice =
                    course.DiscountPrice,

                CreatedAt =
                    item.CreatedAt
            };
        }
    }
}