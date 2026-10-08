namespace Application.Dto_s.Lesson
{
    public class LessonDto
    {
        public int Id { get; set; }

        public int CourseSectionId { get; set; }


        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }


        public string LessonType { get; set; } = string.Empty;


        public string? VideoUrl { get; set; }

        public string? AudioUrl { get; set; }

        public string? Content { get; set; }


        public int? DurationSeconds { get; set; }

        public int OrderIndex { get; set; }


        public bool IsPreview { get; set; }

        public bool IsPublished { get; set; }


        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}