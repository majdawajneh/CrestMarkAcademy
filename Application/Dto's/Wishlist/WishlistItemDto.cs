namespace Application.Dto_s.Wishlist
{
    public class WishlistItemDto
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string CourseTitle { get; set; } = string.Empty;

        public string CourseSlug { get; set; } = string.Empty;

        public string? ThumbnailUrl { get; set; }

        public decimal Price { get; set; }

        public decimal? DiscountPrice { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}