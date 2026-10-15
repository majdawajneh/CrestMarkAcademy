
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrestMarkAcademy.Exceptions
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(
            ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            // =====================================
            // Client disconnected / request canceled
            // =====================================

            if (
                exception is OperationCanceledException &&
                httpContext.RequestAborted.IsCancellationRequested
            )
            {
                _logger.LogDebug(
                    "Request canceled by client. Path: {Path}",
                    httpContext.Request.Path
                );

                // The client disconnected.
                // There is no useful response to send.
                return true;
            }

            // =====================================
            // Status Code
            // =====================================

            var statusCode = GetStatusCode(exception);

            // =====================================
            // Logging
            // =====================================

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(
                    exception,
                    "Unhandled exception occurred. Path: {Path}. Message: {Message}",
                    httpContext.Request.Path,
                    exception.Message
                );
            }
            else
            {
                _logger.LogWarning(
                    "Request failed. Path: {Path}. Status: {StatusCode}. Message: {Message}",
                    httpContext.Request.Path,
                    statusCode,
                    exception.Message
                );
            }

            // =====================================
            // Problem Details
            // =====================================

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = GetTitle(exception),
                Detail = GetDetail(exception),
                Instance = httpContext.Request.Path
            };

            problemDetails.Extensions["traceId"] =
                httpContext.TraceIdentifier;

            // =====================================
            // Response
            // =====================================

            if (httpContext.RequestAborted.IsCancellationRequested)
            {
                _logger.LogDebug(
                    "Response skipped because client disconnected. Path: {Path}",
                    httpContext.Request.Path
                );

                return true;
            }

            if (httpContext.Response.HasStarted)
            {
                _logger.LogWarning(
                    "Cannot write problem details because response has already started. Path: {Path}",
                    httpContext.Request.Path
                );

                return false;
            }

            httpContext.Response.StatusCode = statusCode;

            httpContext.Response.ContentType =
                "application/problem+json";

            try
            {
                await httpContext.Response.WriteAsJsonAsync(
                    problemDetails,
                    cancellationToken
                );
            }
            catch (OperationCanceledException)
                when (
                    httpContext.RequestAborted.IsCancellationRequested ||
                    cancellationToken.IsCancellationRequested
                )
            {
                _logger.LogDebug(
                    "Problem details response canceled. Path: {Path}",
                    httpContext.Request.Path
                );
            }

            return true;
        }

        // =====================================
        // Status Code
        // =====================================

        private static int GetStatusCode(Exception exception)
        {
            return exception switch
            {
                UnauthorizedAccessException =>
                    StatusCodes.Status401Unauthorized,

                KeyNotFoundException =>
                    StatusCodes.Status404NotFound,

                DbUpdateException =>
                    StatusCodes.Status409Conflict,

                InvalidOperationException =>
                    StatusCodes.Status400BadRequest,

                ArgumentException =>
                    StatusCodes.Status400BadRequest,

                _ =>
                    StatusCodes.Status500InternalServerError
            };
        }

        // =====================================
        // Title
        // =====================================

        private static string GetTitle(Exception exception)
        {
            return exception switch
            {
                UnauthorizedAccessException =>
                    "Unauthorized",

                KeyNotFoundException =>
                    "Not Found",

                DbUpdateException =>
                    "Conflict",

                InvalidOperationException =>
                    "Bad Request",

                ArgumentException =>
                    "Bad Request",

                _ =>
                    "Internal Server Error"
            };
        }

        // =====================================
        // Safe Detail
        // =====================================

        private static string GetDetail(Exception exception)
        {
            return exception switch
            {
                UnauthorizedAccessException =>
                    "Your session is invalid or has expired.",

                KeyNotFoundException =>
                    exception.Message,

                InvalidOperationException =>
                    exception.Message,

                ArgumentException =>
                    exception.Message,

                DbUpdateException =>
                    "The operation conflicts with existing database data.",

                _ =>
                    "An unexpected error occurred. Please try again later."
            };
        }
    }
}
