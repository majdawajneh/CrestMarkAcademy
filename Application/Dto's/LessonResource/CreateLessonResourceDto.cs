using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.LessonResource
{
    public class CreateLessonResourceDto
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Title { get; set; } = string.Empty;


        [Required]
        [StringLength(1000)]
        public string ResourceUrl { get; set; } = string.Empty;


        [Required]
        [StringLength(50)]
        public string ResourceType { get; set; } = string.Empty;


        [Range(0, int.MaxValue)]
        public int OrderIndex { get; set; }


        public bool IsDownloadable { get; set; } = true;
    }
}