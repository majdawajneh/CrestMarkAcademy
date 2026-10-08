using Application.Dto_s.Review;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Engagement;

namespace Application.Services
{
    public class ReviewService
        : IReviewService
    {
        private readonly
            IGenericRepository<Review>
            _reviewRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;

        private readonly
            IEnrollmentRepository
            _enrollmentRepo;


        public ReviewService(
            IGenericRepository<Review> reviewRepo,
            IGenericRepository<Course> courseRepo,
            IEnrollmentRepository enrollmentRepo)
        {
            _reviewRepo =
                reviewRepo;

            _courseRepo =
                courseRepo;

            _enrollmentRepo =
                enrollmentRepo;
        }


        // =========================
        // Public Course Reviews
        // =========================

        public async Task<IEnumerable<ReviewDto>>
            GetByCourseAsync(
                int courseId)
        {
            var course =
                await _courseRepo
                    .GetByIdAsync(
                        courseId
                    );


            if (course == null ||
                !string.Equals(
                    course.Status,
                    "Published",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            var reviews =
                await _reviewRepo
                    .FindAsync(
                        r =>
                            r.CourseId ==
                            courseId
                    );


            return reviews
                .OrderByDescending(
                    r => r.CreatedAt
                )
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Create
        // =========================

        public async Task<ReviewDto>
            CreateAsync(
                int userId,
                int courseId,
                CreateReviewDto dto)
        {
            var course =
                await _courseRepo
                    .GetByIdAsync(
                        courseId
                    );


            if (course == null ||
                !string.Equals(
                    course.Status,
                    "Published",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            // Only enrolled students
            // can review the course.

            var enrollment =
                await _enrollmentRepo
                    .GetByUserAndCourseAsync(
                        userId,
                        courseId
                    );


            if (enrollment == null ||
                (
                    !string.Equals(
                        enrollment.Status,
                        "Active",
                        StringComparison.OrdinalIgnoreCase
                    )
                    &&
                    !string.Equals(
                        enrollment.Status,
                        "Completed",
                        StringComparison.OrdinalIgnoreCase
                    )
                ))
            {
                throw new InvalidOperationException(
                    "You must be enrolled in this course before reviewing it."
                );
            }


            var existing =
                await _reviewRepo
                    .FirstOrDefaultAsync(
                        r =>
                            r.UserId ==
                            userId
                            &&
                            r.CourseId ==
                            courseId
                    );


            if (existing != null)
            {
                throw new InvalidOperationException(
                    "You have already reviewed this course."
                );
            }


            var review =
                new Review
                {
                    UserId =
                        userId,

                    CourseId =
                        courseId,

                    Rating =
                        dto.Rating,

                    Comment =
                        NormalizeComment(
                            dto.Comment
                        ),

                    CreatedAt =
                        DateTime.UtcNow
                };


            await _reviewRepo
                .AddAsync(review);


            await _reviewRepo
                .SaveChangesAsync();


            return MapToDto(
                review
            );
        }


        // =========================
        // Update
        // =========================

        public async Task<ReviewDto>
            UpdateAsync(
                int userId,
                int reviewId,
                UpdateReviewDto dto)
        {
            var review =
                await _reviewRepo
                    .GetByIdAsync(
                        reviewId
                    );


            if (review == null ||
                review.UserId != userId)
            {
                throw new KeyNotFoundException(
                    "Review was not found."
                );
            }


            review.Rating =
                dto.Rating;

            review.Comment =
                NormalizeComment(
                    dto.Comment
                );

            review.UpdatedAt =
                DateTime.UtcNow;


            _reviewRepo.Update(
                review
            );


            await _reviewRepo
                .SaveChangesAsync();


            return MapToDto(
                review
            );
        }


        // =========================
        // Delete
        // =========================

        public async Task DeleteAsync(
            int userId,
            int reviewId)
        {
            var review =
                await _reviewRepo
                    .GetByIdAsync(
                        reviewId
                    );


            if (review == null ||
                review.UserId != userId)
            {
                throw new KeyNotFoundException(
                    "Review was not found."
                );
            }


            _reviewRepo.Delete(
                review
            );


            await _reviewRepo
                .SaveChangesAsync();
        }


        private static string?
            NormalizeComment(
                string? comment)
        {
            if (string.IsNullOrWhiteSpace(
                    comment))
            {
                return null;
            }


            return comment.Trim();
        }


        private static ReviewDto
            MapToDto(
                Review review)
        {
            return new ReviewDto
            {
                Id =
                    review.Id,

                UserId =
                    review.UserId,

                CourseId =
                    review.CourseId,

                Rating =
                    review.Rating,

                Comment =
                    review.Comment,

                CreatedAt =
                    review.CreatedAt,

                UpdatedAt =
                    review.UpdatedAt
            };
        }
    }
}