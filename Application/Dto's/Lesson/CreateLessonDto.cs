using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Lesson
{
    public class CreateLessonDto
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Title { get; set; } = string.Empty;


        [StringLength(1000)]
        public string? Description { get; set; }


        [Required]
        [StringLength(30)]
        public string LessonType { get; set; } = "Video";


        [StringLength(1000)]
        public string? VideoUrl { get; set; }


        [StringLength(1000)]
        public string? AudioUrl { get; set; }


        public string? Content { get; set; }


        [Range(0, int.MaxValue)]
        public int? DurationSeconds { get; set; }


        [Range(0, int.MaxValue)]
        public int OrderIndex { get; set; }


        public bool IsPreview { get; set; } = false;


        public bool IsPublished { get; set; } = true;
    }
}