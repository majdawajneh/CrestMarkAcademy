using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.LessonProgress
{
    public class UpdateLessonProgressDto
    {
        [Range(0, int.MaxValue)]
        public int LastPositionSeconds { get; set; }


        public bool IsCompleted { get; set; }
    }
}