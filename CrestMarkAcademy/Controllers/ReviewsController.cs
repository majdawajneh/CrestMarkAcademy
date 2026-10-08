using Application.Dto_s.Review;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController
        : ControllerBase
    {
        private readonly IReviewService
            _reviewService;


        public ReviewsController(
            IReviewService reviewService)
        {
            _reviewService =
                reviewService;
        }


        // =========================
        // Public Reviews
        // =========================

        [HttpGet("courses/{courseId:int}")]
        [AllowAnonymous]
        public async Task<
            ActionResult<IEnumerable<ReviewDto>>>
            GetByCourse(
                int courseId)
        {
            var reviews =
                await _reviewService
                    .GetByCourseAsync(
                        courseId
                    );


            return Ok(reviews);
        }


        // =========================
        // Create Review
        // =========================

        [HttpPost("courses/{courseId:int}")]
        [Authorize]
        public async Task<ActionResult<ReviewDto>>
            Create(
                int courseId,
                CreateReviewDto dto)
        {
            var userId =
                GetCurrentUserId();


            var review =
                await _reviewService
                    .CreateAsync(
                        userId,
                        courseId,
                        dto
                    );


            return Ok(review);
        }


        // =========================
        // Update
        // =========================

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<ActionResult<ReviewDto>>
            Update(
                int id,
                UpdateReviewDto dto)
        {
            var userId =
                GetCurrentUserId();


            var review =
                await _reviewService
                    .UpdateAsync(
                        userId,
                        id,
                        dto
                    );


            return Ok(review);
        }


        // =========================
        // Delete
        // =========================

        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult>
            Delete(
                int id)
        {
            var userId =
                GetCurrentUserId();


            await _reviewService
                .DeleteAsync(
                    userId,
                    id
                );


            return NoContent();
        }


        private int GetCurrentUserId()
        {
            var value =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                    value,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }


            return userId;
        }
    }
}