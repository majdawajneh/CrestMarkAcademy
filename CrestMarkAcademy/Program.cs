using Application.Repositories.Interfaces;
using Application.Services;
using Application.Services.Interfaces;
using CrestMarkAcademy;
using CrestMarkAcademy.Exceptions;
using Domain.Entities.Identity;
using Infrastructure.Context;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Security.Claims;
using System.Text;
using QuestPDF.Infrastructure;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;


var builder = WebApplication.CreateBuilder(args);


// =========================
// Controllers
// =========================

builder.Services.AddControllers();


// =========================
// Database
// =========================

builder.Services.AddDbContext<CrestMark_DbContext>(
    options =>
        options.UseSqlServer(
            builder.Configuration
                .GetConnectionString(
                    "DefaultConnection"
                )
        )
);


// =========================
// Global Exception Handling
// =========================

builder.Services.AddExceptionHandler<
    GlobalExceptionHandler
>();

builder.Services.AddProblemDetails();


// =========================
// Repositories
// =========================

builder.Services.AddScoped(
    typeof(IGenericRepository<>),
    typeof(GenericRepository<>)
);

builder.Services.AddScoped<
    ICourseRepository,
    CourseRepository
>();

builder.Services.AddScoped<
    IEnrollmentRepository,
    EnrollmentRepository
>();

builder.Services.AddScoped<
    ILessonProgressRepository,
    LessonProgressRepository
>();

builder.Services.AddScoped<
    ICertificateRepository,
    CertificateRepository
>();

builder.Services.AddScoped<
    IOrderRepository,
    OrderRepository
>();

builder.Services.AddScoped<
    ICouponRepository,
    CouponRepository
>();

builder.Services.AddScoped<
    IPaymentRepository,
    PaymentRepository
>();

builder.Services.AddScoped<
    IUserRepository,
    UserRepository
>();


// =========================
// Services
// =========================

builder.Services.AddScoped<
    IAuthService,
    AuthService
>();

builder.Services.AddScoped<
    ITokenService,
    TokenService
>();

builder.Services.AddScoped<
    IEmailService,
    EmailService
>();

builder.Services.Configure<EmailSettings>(
    builder.Configuration
        .GetSection(
            "EmailSettings"
        )
);

builder.Services.AddScoped<
    ICategoryService,
    CategoryService
>();

builder.Services.AddScoped<
    ICourseService,
    CourseService
>();

builder.Services.AddScoped<
    ICourseRequirementService,
    CourseRequirementService
>();

builder.Services.AddScoped<
    ICourseLearningOutcomeService,
    CourseLearningOutcomeService
>();

builder.Services.AddScoped<
    ICourseSectionService,
    CourseSectionService
>();

builder.Services.AddScoped<
    ILessonService,
    LessonService
>();

builder.Services.AddScoped<
    ILessonResourceService,
    LessonResourceService
>();

builder.Services.AddScoped<
    ICourseContentService,
    CourseContentService
>();

builder.Services.AddScoped<
    IEnrollmentService,
    EnrollmentService
>();

builder.Services.AddScoped<
    ILessonProgressService,
    LessonProgressService
>();

builder.Services.AddScoped<
    ICertificateService,
    CertificateService
>();

builder.Services.AddScoped<
    IOrderService,
    OrderService
>();

builder.Services.AddScoped<
    ICouponService,
    CouponService
>();

builder.Services.AddScoped<
    IPaymentService,
    PaymentService
>();

builder.Services.AddScoped<
    ICertificatePdfService,
    CertificatePdfService>();


builder.Services.AddHttpClient<PayTabsService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});


builder.Services.AddScoped<
    IWishlistService,
    WishlistService
>();

builder.Services.AddScoped<
    IReviewService,
    ReviewService
>();

builder.Services.AddScoped<
    INotificationService,
    NotificationService
>();

builder.Services.AddScoped<
    IProfileService,
    ProfileService
>();

builder.Services.AddScoped<
    IAdminUserService,
    AdminUserService
>();

builder.Services.AddScoped<
    IAdminOrderService,
    AdminOrderService
>();

builder.Services.AddScoped<
    IAdminPaymentService,
    AdminPaymentService
>();


// =========================
// Password Hasher
// =========================

builder.Services.AddScoped<
    IPasswordHasher<User>,
    PasswordHasher<User>
>();


// =========================
// JWT Configuration
// =========================

var jwtKey =
    builder.Configuration["JWT:Key"]
    ?? throw new InvalidOperationException(
        "JWT Key is missing."
    );


var jwtIssuer =
    builder.Configuration["JWT:Issuer"]
    ?? throw new InvalidOperationException(
        "JWT Issuer is missing."
    );


var jwtAudience =
    builder.Configuration["JWT:Audience"]
    ?? throw new InvalidOperationException(
        "JWT Audience is missing."
    );


// =========================
// JWT Authentication
// =========================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer =
                    true,

                ValidateAudience =
                    true,

                ValidateLifetime =
                    true,

                ValidateIssuerSigningKey =
                    true,

                ValidIssuer =
                    jwtIssuer,

                ValidAudience =
                    jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8
                            .GetBytes(
                                jwtKey
                            )
                    ),

                ClockSkew =
                    TimeSpan.Zero
            };


        // =========================
        // Validate Active User
        // =========================

        options.Events =
            new JwtBearerEvents
            {
                OnTokenValidated =
                    async context =>
                    {
                        // =========================
                        // Get User Id From JWT
                        // =========================

                        var userIdValue =
                            context.Principal?
                                .FindFirst(
                                    ClaimTypes.NameIdentifier
                                )?
                                .Value;


                        // Fallback in case the token
                        // stores the id as "sub".

                        if (string.IsNullOrWhiteSpace(
                                userIdValue))
                        {
                            userIdValue =
                                context.Principal?
                                    .FindFirst(
                                        "sub"
                                    )?
                                    .Value;
                        }


                        if (!int.TryParse(
                                userIdValue,
                                out var userId))
                        {
                            context.Fail(
                                "Invalid access token."
                            );

                            return;
                        }


                        // =========================
                        // Get Database
                        // =========================

                        var dbContext =
                            context.HttpContext
                                .RequestServices
                                .GetRequiredService<
                                    CrestMark_DbContext
                                >();


                        // =========================
                        // Check User Status
                        // =========================

                        var userIsActive =
                            await dbContext
                                .Users
                                .AsNoTracking()
                                .AnyAsync(
                                    user =>
                                        user.Id ==
                                            userId &&
                                        user.IsActive
                                );


                        if (!userIsActive)
                        {
                            context.Fail(
                                "User account is inactive."
                            );

                            return;
                        }
                    }
            };
    });


builder.Services.AddAuthorization();


// =========================
// Swagger
// =========================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(
    options =>
    {
        options.AddSecurityDefinition(
            "Bearer",
            new OpenApiSecurityScheme
            {
                Name =
                    "Authorization",

                Type =
                    SecuritySchemeType.Http,

                Scheme =
                    "bearer",

                BearerFormat =
                    "JWT",

                In =
                    ParameterLocation.Header,

                Description =
                    "Enter your JWT Access Token"
            }
        );


        options.AddSecurityRequirement(
            document =>
                new OpenApiSecurityRequirement
                {
                    [
                        new OpenApiSecuritySchemeReference(
                            "Bearer",
                            document
                        )
                    ] = []
                }
        );
    }
);



builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddPolicy("certificate-verification", context =>
    {
        var clientIp =
            context.Connection.RemoteIpAddress?
                .MapToIPv4()
                .ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }
        );
    });
});


var app =
    builder.Build();


// =========================
// Seed Data
// =========================

using (var scope =
       app.Services.CreateScope())
{
    var services =
        scope.ServiceProvider;


    var context =
        services
            .GetRequiredService<
                CrestMark_DbContext
            >();


    var passwordHasher =
        services
            .GetRequiredService<
                IPasswordHasher<User>
            >();


    var configuration =
        services
            .GetRequiredService<
                IConfiguration
            >();


    await SeedData.InitializeAsync(
        context,
        passwordHasher,
        configuration
    );
}


// =========================
// Pipeline
// =========================

app.UseExceptionHandler();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}


app.UseHttpsRedirection();

app.UseRateLimiter();
// Authentication MUST come
// before Authorization.

app.UseAuthentication();

app.UseAuthorization();


app.MapControllers();

QuestPDF.Settings.License = LicenseType.Community;



app.Run();