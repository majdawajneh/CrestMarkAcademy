using Domain.Entities.Catalog;
using Domain.Entities.Commerce;
using Domain.Entities.Engagement;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;
using Domain.Entities.Learning;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Context
{
    public class CrestMark_DbContext : DbContext
    {
        public CrestMark_DbContext(
            DbContextOptions<CrestMark_DbContext> options)
            : base(options)
        {
        }


        // =========================
        // Identity
        // =========================

        public DbSet<User> Users { get; set; }

        public DbSet<UserProfile> UserProfiles { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<UserRole> UserRoles { get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<UserToken> UserTokens { get; set; }


        // =========================
        // Catalog
        // =========================

        public DbSet<Category> Categories { get; set; }

        public DbSet<Course> Courses { get; set; }

        public DbSet<CourseRequirement> CourseRequirements { get; set; }

        public DbSet<CourseLearningOutcome> CourseLearningOutcomes { get; set; }

        public DbSet<CourseSection> CourseSections { get; set; }

        public DbSet<Lesson> Lessons { get; set; }

        public DbSet<LessonResource> LessonResources { get; set; }


        // =========================
        // Learning
        // =========================

        public DbSet<Enrollment> Enrollments { get; set; }

        public DbSet<LessonProgress> LessonProgresses { get; set; }

        public DbSet<Certificate> Certificates { get; set; }


        // =========================
        // Commerce
        // =========================

        public DbSet<Order> Orders { get; set; }

        public DbSet<OrderItem> OrderItems { get; set; }

        public DbSet<Payment> Payments { get; set; }

        public DbSet<Coupon> Coupons { get; set; }

        public DbSet<CouponCourse> CouponCourses { get; set; }


        // =========================
        // Engagement
        // =========================

        public DbSet<Review> Reviews { get; set; }

        public DbSet<WishlistItem> WishlistItems { get; set; }

        public DbSet<Notification> Notifications { get; set; }


        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // =========================
            // Identity Configuration
            // =========================


            // =========================
            // User Email Unique
            // =========================

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();


            // =========================
            // Username Unique
            // =========================

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();


            // =========================
            // User <-> UserProfile
            // One-to-One
            // =========================

            modelBuilder.Entity<User>()
                .HasOne(u => u.UserProfile)
                .WithOne(up => up.User)
                .HasForeignKey<UserProfile>(
                    up => up.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Role Name Unique
            // =========================

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();


            // =========================
            // UserRole Composite Key
            // =========================

            modelBuilder.Entity<UserRole>()
                .HasKey(
                    ur => new
                    {
                        ur.UserId,
                        ur.RoleId
                    }
                );


            // =========================
            // User <-> UserRole
            // =========================

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(
                    ur => ur.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Role <-> UserRole
            // =========================

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(
                    ur => ur.RoleId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // RefreshToken Unique
            // =========================

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique();


            // =========================
            // User -> RefreshTokens
            // =========================

            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(
                    rt => rt.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // UserToken
            // =========================

            modelBuilder.Entity<UserToken>(
                entity =>
                {
                    entity.HasKey(
                        ut => ut.Id
                    );


                    entity.Property(
                            ut => ut.TokenHash
                        )
                        .IsRequired()
                        .HasMaxLength(64);


                    entity.HasIndex(
                            ut => ut.TokenHash
                        )
                        .IsUnique();


                    entity.Property(
                            ut => ut.Purpose
                        )
                        .IsRequired();


                    entity.Property(
                            ut => ut.CreatedAt
                        )
                        .IsRequired();


                    entity.Property(
                            ut => ut.ExpiresAt
                        )
                        .IsRequired();


                    entity.Property(
                            ut => ut.IsUsed
                        )
                        .IsRequired();


                    entity.HasIndex(
                        ut => new
                        {
                            ut.UserId,
                            ut.Purpose,
                            ut.IsUsed
                        }
                    );


                    entity.HasOne(
                            ut => ut.User
                        )
                        .WithMany(
                            u => u.UserTokens
                        )
                        .HasForeignKey(
                            ut => ut.UserId
                        )
                        .OnDelete(
                            DeleteBehavior.Cascade
                        );
                }
            );


            // =========================
            // Catalog Configuration
            // =========================


            // =========================
            // Category Slug Unique
            // =========================

            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Slug)
                .IsUnique();


            // =========================
            // Category Self Relation
            // =========================

            modelBuilder.Entity<Category>()
                .HasOne(
                    c => c.ParentCategory
                )
                .WithMany(
                    c => c.SubCategories
                )
                .HasForeignKey(
                    c => c.ParentCategoryId
                )
                .OnDelete(
                    DeleteBehavior.Restrict
                );


            // =========================
            // Category -> Courses
            // =========================

            modelBuilder.Entity<Course>()
                .HasOne(c => c.Category)
                .WithMany(c => c.Courses)
                .HasForeignKey(
                    c => c.CategoryId
                )
                .OnDelete(
                    DeleteBehavior.Restrict
                );


            // =========================
            // Instructor -> Courses
            // =========================

            modelBuilder.Entity<Course>()
                .HasOne(c => c.Instructor)
                .WithMany(
                    u => u.InstructorCourses
                )
                .HasForeignKey(
                    c => c.InstructorId
                )
                .OnDelete(
                    DeleteBehavior.SetNull
                );


            // =========================
            // Course Slug Unique
            // =========================

            modelBuilder.Entity<Course>()
                .HasIndex(c => c.Slug)
                .IsUnique();


            // =========================
            // Course Prices
            // =========================

            modelBuilder.Entity<Course>()
                .Property(c => c.Price)
                .HasPrecision(
                    18,
                    2
                );


            modelBuilder.Entity<Course>()
                .Property(
                    c => c.DiscountPrice
                )
                .HasPrecision(
                    18,
                    2
                );


            // =========================
            // Course -> Requirements
            // =========================

            modelBuilder.Entity<CourseRequirement>()
                .HasOne(cr => cr.Course)
                .WithMany(
                    c => c.Requirements
                )
                .HasForeignKey(
                    cr => cr.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> Learning Outcomes
            // =========================

            modelBuilder.Entity<CourseLearningOutcome>()
                .HasOne(clo => clo.Course)
                .WithMany(
                    c => c.LearningOutcomes
                )
                .HasForeignKey(
                    clo => clo.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> Sections
            // =========================

            modelBuilder.Entity<CourseSection>()
                .HasOne(cs => cs.Course)
                .WithMany(
                    c => c.CourseSections
                )
                .HasForeignKey(
                    cs => cs.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Section -> Lessons
            // =========================

            modelBuilder.Entity<Lesson>()
                .HasOne(
                    l => l.CourseSection
                )
                .WithMany(
                    cs => cs.Lessons
                )
                .HasForeignKey(
                    l => l.CourseSectionId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Lesson -> Resources
            // =========================

            modelBuilder.Entity<LessonResource>()
                .HasOne(lr => lr.Lesson)
                .WithMany(
                    l => l.LessonResources
                )
                .HasForeignKey(
                    lr => lr.LessonId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Learning Configuration
            // =========================


            // =========================
            // User -> Enrollments
            // =========================

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.User)
                .WithMany(
                    u => u.Enrollments
                )
                .HasForeignKey(
                    e => e.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> Enrollments
            // =========================

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(
                    c => c.Enrollments
                )
                .HasForeignKey(
                    e => e.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Restrict
                );


            // =========================
            // One Enrollment
            // per User / Course
            // =========================

            modelBuilder.Entity<Enrollment>()
                .HasIndex(
                    e => new
                    {
                        e.UserId,
                        e.CourseId
                    }
                )
                .IsUnique();


            // =========================
            // Enrollment -> Progress
            // =========================

            modelBuilder.Entity<LessonProgress>()
                .HasOne(
                    lp => lp.Enrollment
                )
                .WithMany(
                    e => e.LessonProgresses
                )
                .HasForeignKey(
                    lp => lp.EnrollmentId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Lesson -> Progress
            // =========================

            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.Lesson)
                .WithMany(
                    l => l.LessonProgresses
                )
                .HasForeignKey(
                    lp => lp.LessonId
                )
                .OnDelete(
                    DeleteBehavior.NoAction
                );


            // =========================
            // One Progress
            // per Enrollment / Lesson
            // =========================

            modelBuilder.Entity<LessonProgress>()
                .HasIndex(
                    lp => new
                    {
                        lp.EnrollmentId,
                        lp.LessonId
                    }
                )
                .IsUnique();


            // =========================
            // Enrollment -> Certificate
            // One-to-One
            // =========================

            modelBuilder.Entity<Enrollment>()
                .HasOne(
                    e => e.Certificate
                )
                .WithOne(
                    c => c.Enrollment
                )
                .HasForeignKey<Certificate>(
                    c => c.EnrollmentId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Certificate Number Unique
            // =========================

            modelBuilder.Entity<Certificate>()
                .HasIndex(
                    c => c.CertificateNumber
                )
                .IsUnique();


            // =========================
            // One Certificate
            // per Enrollment
            // =========================

            modelBuilder.Entity<Certificate>()
                .HasIndex(
                    c => c.EnrollmentId
                )
                .IsUnique();


            // =========================
            // Commerce Configuration
            // =========================


            // =========================
            // User -> Orders
            // =========================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(
                    u => u.Orders
                )
                .HasForeignKey(
                    o => o.UserId
                )
                .OnDelete(
                    DeleteBehavior.Restrict
                );


            // =========================
            // OrderNumber Unique
            // =========================

            modelBuilder.Entity<Order>()
                .HasIndex(
                    o => o.OrderNumber
                )
                .IsUnique();


            // =========================
            // Order Prices
            // =========================

            modelBuilder.Entity<Order>()
                .Property(
                    o => o.Subtotal
                )
                .HasPrecision(
                    18,
                    2
                );


            modelBuilder.Entity<Order>()
                .Property(
                    o => o.DiscountAmount
                )
                .HasPrecision(
                    18,
                    2
                );


            modelBuilder.Entity<Order>()
                .Property(
                    o => o.TotalAmount
                )
                .HasPrecision(
                    18,
                    2
                );


            // =========================
            // Order -> OrderItems
            // =========================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(
                    o => o.OrderItems
                )
                .HasForeignKey(
                    oi => oi.OrderId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> OrderItems
            // =========================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Course)
                .WithMany(
                    c => c.OrderItems
                )
                .HasForeignKey(
                    oi => oi.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Restrict
                );


            // =========================
            // OrderItem Prices
            // =========================

            modelBuilder.Entity<OrderItem>()
                .Property(
                    oi => oi.UnitPrice
                )
                .HasPrecision(
                    18,
                    2
                );


            modelBuilder.Entity<OrderItem>()
                .Property(
                    oi => oi.DiscountAmount
                )
                .HasPrecision(
                    18,
                    2
                );


            modelBuilder.Entity<OrderItem>()
                .Property(
                    oi => oi.FinalPrice
                )
                .HasPrecision(
                    18,
                    2
                );


            // =========================
            // One Course Only Once
            // Inside Same Order
            // =========================

            modelBuilder.Entity<OrderItem>()
                .HasIndex(
                    oi => new
                    {
                        oi.OrderId,
                        oi.CourseId
                    }
                )
                .IsUnique();


            // =========================
            // Order -> Payments
            // =========================

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithMany(
                    o => o.Payments
                )
                .HasForeignKey(
                    p => p.OrderId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Payment Amount
            // =========================

            modelBuilder.Entity<Payment>()
                .Property(
                    p => p.Amount
                )
                .HasPrecision(
                    18,
                    2
                );


            // =========================
            // Gateway Transaction Reference Unique
            // =========================

            modelBuilder.Entity<Payment>()
                .HasIndex(
                    p => p.GatewayTransactionReference
                )
                .IsUnique()
                .HasFilter(
                    "[GatewayTransactionReference] IS NOT NULL"
                );



            // =========================
            // TransactionId Unique
            // =========================

            modelBuilder.Entity<Payment>()
                .HasIndex(
                    p => p.TransactionId
                )
                .IsUnique()
                .HasFilter(
                    "[TransactionId] IS NOT NULL"
                );


            // =========================
            // Only One Pending Payment
            // Per Order
            // =========================

            modelBuilder.Entity<Payment>()
                .HasIndex(
                    p => p.OrderId
                )
                .IsUnique()
                .HasFilter(
                    "[Status] = 'Pending'"
                );


            // =========================
            // Coupon Code Unique
            // =========================

            modelBuilder.Entity<Coupon>()
                .HasIndex(c => c.Code)
                .IsUnique();


            // =========================
            // Coupon Discount Precision
            // =========================

            modelBuilder.Entity<Coupon>()
                .Property(
                    c => c.DiscountValue
                )
                .HasPrecision(
                    18,
                    2
                );


            // =========================
            // CouponCourse
            // Composite Primary Key
            // =========================

            modelBuilder.Entity<CouponCourse>()
                .HasKey(
                    cc => new
                    {
                        cc.CouponId,
                        cc.CourseId
                    }
                );


            // =========================
            // Coupon -> CouponCourses
            // =========================

            modelBuilder.Entity<CouponCourse>()
                .HasOne(cc => cc.Coupon)
                .WithMany(
                    c => c.CouponCourses
                )
                .HasForeignKey(
                    cc => cc.CouponId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> CouponCourses
            // =========================

            modelBuilder.Entity<CouponCourse>()
                .HasOne(cc => cc.Course)
                .WithMany(
                    c => c.CouponCourses
                )
                .HasForeignKey(
                    cc => cc.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Order -> Coupon
            // =========================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Coupon)
                .WithMany(
                    c => c.Orders
                )
                .HasForeignKey(
                    o => o.CouponId
                )
                .OnDelete(
                    DeleteBehavior.SetNull
                );


            // =========================
            // Engagement Configuration
            // =========================


            // =========================
            // User -> Reviews
            // =========================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(
                    u => u.Reviews
                )
                .HasForeignKey(
                    r => r.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> Reviews
            // =========================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Course)
                .WithMany(
                    c => c.Reviews
                )
                .HasForeignKey(
                    r => r.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // One Review
            // per User / Course
            // =========================

            modelBuilder.Entity<Review>()
                .HasIndex(
                    r => new
                    {
                        r.UserId,
                        r.CourseId
                    }
                )
                .IsUnique();


            // =========================
            // User -> Wishlist
            // =========================

            modelBuilder.Entity<WishlistItem>()
                .HasOne(w => w.User)
                .WithMany(
                    u => u.WishlistItems
                )
                .HasForeignKey(
                    w => w.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // Course -> Wishlist
            // =========================

            modelBuilder.Entity<WishlistItem>()
                .HasOne(w => w.Course)
                .WithMany(
                    c => c.WishlistItems
                )
                .HasForeignKey(
                    w => w.CourseId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );


            // =========================
            // One Wishlist Entry
            // per User / Course
            // =========================

            modelBuilder.Entity<WishlistItem>()
                .HasIndex(
                    w => new
                    {
                        w.UserId,
                        w.CourseId
                    }
                )
                .IsUnique();


            // =========================
            // User -> Notifications
            // =========================

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(
                    u => u.Notifications
                )
                .HasForeignKey(
                    n => n.UserId
                )
                .OnDelete(
                    DeleteBehavior.Cascade
                );
        }
    }
}