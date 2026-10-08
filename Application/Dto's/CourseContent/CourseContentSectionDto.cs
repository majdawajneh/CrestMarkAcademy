namespace Application.Dto_s.CourseContent
{
    public class CourseContentSectionDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int OrderIndex { get; set; }


        public IEnumerable<CourseContentLessonDto>
            Lessons
        { get; set; }
            = new List<CourseContentLessonDto>();
    }
}