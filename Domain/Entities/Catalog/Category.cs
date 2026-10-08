namespace Domain.Entities.Catalog
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;


        public int? ParentCategoryId { get; set; }

        public Category? ParentCategory { get; set; }

        public ICollection<Category> SubCategories { get; set; } = new List<Category>();


        public ICollection<Course> Courses { get; set; } = new List<Course>();

    }
}
