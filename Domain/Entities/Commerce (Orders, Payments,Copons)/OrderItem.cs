using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Commerce
{
    public class OrderItem
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public int CourseId { get; set; }

        public string CourseTitle { get; set; } = string.Empty;

        public decimal UnitPrice { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal FinalPrice { get; set; }


        // Navigation Properties

        public Order Order { get; set; } = null!;

        public Course Course { get; set; } = null!;
    }
}
