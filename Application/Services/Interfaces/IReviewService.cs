using Application.Dto_s.Review;

namespace Application.Services.Interfaces
{
    public interface IReviewService
    {
        Task<IEnumerable<ReviewDto>>
            GetByCourseAsync(
                int courseId
            );

        Task<ReviewDto>
            CreateAsync(
                int userId,
                int courseId,
                CreateReviewDto dto
            );

        Task<ReviewDto>
            UpdateAsync(
                int userId,
                int reviewId,
                UpdateReviewDto dto
            );

        Task DeleteAsync(
            int userId,
            int reviewId
        );
    }
}