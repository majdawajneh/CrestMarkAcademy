using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.Category
{
    public class CreateCategoryDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;


        [StringLength(500)]
        public string? Description { get; set; }


        [StringLength(500)]
        public string? ImageUrl { get; set; }


        public int? ParentCategoryId { get; set; }


        public bool IsActive { get; set; } = true;
    }
}
