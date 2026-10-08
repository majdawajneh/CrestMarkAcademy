using Application.Dto_s.Wishlist;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/wishlist")]
    [Authorize]
    public class WishlistController
        : ControllerBase
    {
        private readonly IWishlistService
            _wishlistService;


        public WishlistController(
            IWishlistService wishlistService)
        {
            _wishlistService =
                wishlistService;
        }


        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<WishlistItemDto>>>
            GetMyWishlist()
        {
            var userId =
                GetCurrentUserId();


            var items =
                await _wishlistService
                    .GetMyWishlistAsync(
                        userId
                    );


            return Ok(items);
        }


        [HttpPost("courses/{courseId:int}")]
        public async Task<ActionResult<WishlistItemDto>>
            Add(
                int courseId)
        {
            var userId =
                GetCurrentUserId();


            var item =
                await _wishlistService
                    .AddAsync(
                        userId,
                        courseId
                    );


            return Ok(item);
        }


        [HttpDelete("courses/{courseId:int}")]
        public async Task<IActionResult>
            Remove(
                int courseId)
        {
            var userId =
                GetCurrentUserId();


            await _wishlistService
                .RemoveAsync(
                    userId,
                    courseId
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