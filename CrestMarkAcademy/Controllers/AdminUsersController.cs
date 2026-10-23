
using Application.Dto_s.User;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(
            IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        // ========================================
        // Get All Users
        // ========================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminUserListDto>>>
            GetAll()
        {
            var users = await _adminUserService.GetAllAsync();

            return Ok(users);
        }

        // ========================================
        // Get User By Id
        // ========================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AdminUserDetailsDto>>
            GetById(int id)
        {
            var user = await _adminUserService
                .GetByIdAsync(id);

            return Ok(user);
        }

        // ========================================
        // Deactivate User
        // ========================================

        [HttpPatch("{id:int}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var adminUserId = GetCurrentUserId();

            await _adminUserService.DeactivateAsync(
                adminUserId,
                id
            );

            return NoContent();
        }

        // ========================================
        // Activate User
        // ========================================

        [HttpPatch("{id:int}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            await _adminUserService.ActivateAsync(id);

            return NoContent();
        }

        // ========================================
        // Assign Instructor Role
        // PATCH /api/admin/users/{id}/instructor
        // ========================================

        [HttpPatch("{id:int}/instructor")]
        public async Task<IActionResult> AssignInstructor(int id)
        {
            await _adminUserService.AssignInstructorAsync(id);

            return NoContent();
        }

        // ========================================
        // Remove Instructor Role
        // DELETE /api/admin/users/{id}/instructor
        // ========================================

        [HttpDelete("{id:int}/instructor")]
        public async Task<IActionResult> RemoveInstructor(int id)
        {
            await _adminUserService.RemoveInstructorAsync(id);

            return NoContent();
        }

        // ========================================
        // Current Admin ID
        // ========================================

        private int GetCurrentUserId()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (!int.TryParse(value, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }

            return userId;
        }
        // ========================================
        // Create Instructor Account
        // POST /api/admin/users/instructors
        // ========================================

        [HttpPost("instructors")]
        public async Task<ActionResult<AdminUserDetailsDto>>
            CreateInstructor([FromBody] CreateInstructorDto dto)
        {
            var instructor = await _adminUserService
                .CreateInstructorAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = instructor.Id },
                instructor
            );
        }

        // ========================================
        // Resend Instructor Invitation
        // POST /api/admin/users/{id}/resend-invitation
        // ========================================

        [HttpPost("{id:int}/resend-invitation")]
        public async Task<IActionResult> ResendInstructorInvitation(int id)
        {
            await _adminUserService
                .ResendInstructorInvitationAsync(id);

            return Ok(new
            {
                message = "Instructor invitation sent successfully."
            });
        }
    }
}
