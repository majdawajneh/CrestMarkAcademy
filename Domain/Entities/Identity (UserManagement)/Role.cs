using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Identity
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
