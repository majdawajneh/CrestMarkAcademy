namespace Application.Dto_s.CourseContent
{
    public class CourseContentLessonDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }


        public string LessonType { get; set; } = string.Empty;

        public int? DurationSeconds { get; set; }

        public int OrderIndex { get; set; }


        public bool IsPreview { get; set; }

        public bool IsLocked { get; set; }


        public string? VideoUrl { get; set; }

        public string? AudioUrl { get; set; }

        public string? Content { get; set; }
    }
}