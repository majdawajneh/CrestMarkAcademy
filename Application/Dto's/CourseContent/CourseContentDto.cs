namespace Application.Dto_s.CourseContent
{
    public class CourseContentDto
    {
        public int CourseId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;


        public bool IsEnrolled { get; set; }


        public IEnumerable<CourseContentSectionDto>
            Sections
        { get; set; }
            = new List<CourseContentSectionDto>();
    }
}