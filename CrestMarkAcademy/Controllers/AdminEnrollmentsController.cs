
using Application.Dto_s.Enrollment;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/enrollments")]
    [Authorize(Roles = "Admin")]
    public class AdminEnrollmentsController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        // ======================================
        // Constructor
        // ======================================

        public AdminEnrollmentsController(
            IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        // ======================================
        // Get All Enrollments
        // Admin Only
        // ======================================

        [HttpGet]
        public async Task<ActionResult<List<EnrollmentDto>>> GetAll()
        {
            var enrollments = await _enrollmentService
                .GetAllForAdminAsync();

            return Ok(enrollments);
        }

        // ======================================
        // Get Enrollments By User Id
        // Admin Only
        // ======================================

        [HttpGet("users/{userId:int}")]
        public async Task<ActionResult<List<EnrollmentDto>>> GetByUserId(
            int userId)
        {
            var enrollments = await _enrollmentService
                .GetByUserIdForAdminAsync(userId);

            return Ok(enrollments);
        }

        // ======================================
        // Get Enrollment By Id
        // ======================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<EnrollmentDto>> GetById(
            int id)
        {
            var enrollment = await _enrollmentService
                .GetByIdAsync(id);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    Message = "Enrollment was not found."
                });
            }

            return Ok(enrollment);
        }

        // ======================================
        // Get Enrollment By User + Course
        // ======================================

        [HttpGet("users/{userId:int}/courses/{courseId:int}")]
        public async Task<ActionResult<EnrollmentDto>>
            GetByUserAndCourse(
                int userId,
                int courseId)
        {
            var enrollment = await _enrollmentService
                .GetByUserAndCourseAsync(
                    userId,
                    courseId
                );

            if (enrollment == null)
            {
                return NotFound(new
                {
                    Message = "Enrollment was not found."
                });
            }

            return Ok(enrollment);
        }

        // ======================================
        // Enroll User In Course
        // ======================================

        [HttpPost("users/{userId:int}/courses/{courseId:int}")]
        public async Task<ActionResult<EnrollmentDto>> EnrollUser(
            int userId,
            int courseId)
        {
            var enrollment = await _enrollmentService
                .EnrollUserAsync(
                    userId,
                    courseId
                );

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = enrollment.Id
                },
                enrollment
            );
        }

        // ======================================
        // Cancel Enrollment
        // ======================================

        [HttpPatch("{id:int}/cancel")]
        public async Task<ActionResult<EnrollmentDto>> Cancel(
            int id)
        {
            var enrollment = await _enrollmentService
                .CancelAsync(id);

            return Ok(enrollment);
        }

        // ======================================
        // Reactivate Enrollment
        // ======================================

        [HttpPatch("{id:int}/reactivate")]
        public async Task<ActionResult<EnrollmentDto>> Reactivate(
            int id)
        {
            var enrollment = await _enrollmentService
                .ReactivateAsync(id);

            return Ok(enrollment);
        }
    }
}
