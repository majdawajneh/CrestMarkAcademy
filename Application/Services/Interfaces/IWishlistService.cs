using Application.Dto_s.Wishlist;

namespace Application.Services.Interfaces
{
    public interface IWishlistService
    {
        Task<IEnumerable<WishlistItemDto>>
            GetMyWishlistAsync(int userId);

        Task<WishlistItemDto>
            AddAsync(
                int userId,
                int courseId
            );

        Task RemoveAsync(
            int userId,
            int courseId
        );
    }
}