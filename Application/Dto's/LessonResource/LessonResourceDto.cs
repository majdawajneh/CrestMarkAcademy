namespace Application.Dto_s.LessonResource
{
    public class LessonResourceDto
    {
        public int Id { get; set; }

        public int LessonId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string ResourceUrl { get; set; } = string.Empty;

        public string ResourceType { get; set; } = string.Empty;

        public int OrderIndex { get; set; }

        public bool IsDownloadable { get; set; }
    }
}