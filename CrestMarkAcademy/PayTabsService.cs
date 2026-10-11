
using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using Application.Dto_s.Payment;
using Application.Services.Interfaces;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace CrestMarkAcademy;

public sealed class PayTabsService
{
    private const string BaseUrl =
        "https://secure-jordan.paytabs.com";

    private const string CartPrefix =
        "crestmark-payment-";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly CrestMark_DbContext _db;
    private readonly IPaymentService _payments;

    public PayTabsService(
        HttpClient http,
        IConfiguration config,
        CrestMark_DbContext db,
        IPaymentService payments)
    {
        _http = http;
        _config = config;
        _db = db;
        _payments = payments;
    }

    // =========================
    // Settings
    // =========================

    private (
        int ProfileId,
        string Key,
        string CallbackUrl,
        string ReturnUrl
    ) Settings()
    {
        var profileId = _config.GetValue<int>(
            "PayTabs:ProfileId");

        var key = _config["PayTabs:ServerKey"];
        var callback = _config["PayTabs:CallbackUrl"];
        var returnUrl = _config["PayTabs:ReturnUrl"];

        if (profileId <= 0 ||
            string.IsNullOrWhiteSpace(key) ||
            !IsHttpsUrl(callback) ||
            !IsHttpsUrl(returnUrl))
        {
            throw new InvalidOperationException(
                "PayTabs configuration is missing or invalid.");
        }

        return (
            profileId,
            key!,
            callback!,
            returnUrl!
        );
    }

    private static bool IsHttpsUrl(string? value)
    {
        return Uri.TryCreate(
            value,
            UriKind.Absolute,
            out var uri
        ) &&
        uri.Scheme == Uri.UriSchemeHttps &&
        string.IsNullOrEmpty(uri.UserInfo);
    }

    // =========================
    // PayTabs API Request
    // =========================

    private async Task<JsonDocument> SendAsync(
        string endpoint,
        object payload,
        CancellationToken ct)
    {
        var settings = Settings();

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            BaseUrl + endpoint
        );

        request.Headers.TryAddWithoutValidation(
            "authorization",
            settings.Key
        );

        request.Content = JsonContent.Create(payload);

        using var response = await _http.SendAsync(
            request,
            ct
        );

        response.EnsureSuccessStatusCode();

        using var stream =
            await response.Content.ReadAsStreamAsync(ct);

        return await JsonDocument.ParseAsync(
            stream,
            cancellationToken: ct
        );
    }

    // =========================
    // JSON Helper
    // =========================

    private static string? ReadString(
        JsonElement root,
        string propertyName)
    {
        if (root.ValueKind != JsonValueKind.Object ||
            !root.TryGetProperty(
                propertyName,
                out var property) ||
            property.ValueKind == JsonValueKind.Null ||
            property.ValueKind == JsonValueKind.Undefined)
        {
            return null;
        }

        return property.ToString();
    }

    // =========================
    // Start Checkout
    // =========================

    public async Task<string> StartAsync(
        int userId,
        int orderId,
        CancellationToken ct)
    {
        var settings = Settings();

        var payment = await _payments.CreateAsync(
            userId,
            orderId,
            new CreatePaymentDto
            {
                PaymentProvider = "PayTabs"
            }
        );

        if (!string.Equals(
                payment.Status,
                "Pending",
                StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(
                payment.PaymentProvider,
                "PayTabs",
                StringComparison.OrdinalIgnoreCase) ||
            payment.Amount <= 0 ||
            string.IsNullOrWhiteSpace(payment.Currency))
        {
            throw new InvalidOperationException(
                "Payment is not eligible for checkout.");
        }

        // =========================
        // Atomic Checkout Reservation
        // =========================

        var claimed = await _db.Payments
            .Where(p =>
                p.Id == payment.Id &&
                p.Status == "Pending" &&
                p.PaymentProvider == "PayTabs" &&
                p.CheckoutStatus == "NotStarted" &&
                p.GatewayTransactionReference == null)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(
                        p => p.CheckoutStatus,
                        "Initializing")
                    .SetProperty(
                        p => p.CheckoutStartedAt,
                        DateTime.UtcNow),
                ct
            );

        if (claimed != 1)
        {
            throw new InvalidOperationException(
                "Checkout is already being initialized or has been started.");
        }

        // =========================
        // Create PayTabs Session
        // =========================

        try
        {
            using var reply = await SendAsync(
                "/payment/request",
                new
                {
                    profile_id = settings.ProfileId,
                    tran_type = "sale",
                    tran_class = "ecom",

                    cart_id =
                        $"{CartPrefix}{payment.Id}",

                    cart_currency =
                        payment.Currency.ToUpperInvariant(),

                    cart_amount = payment.Amount,

                    cart_description =
                        $"CrestMark order {payment.OrderNumber}",

                    callback = settings.CallbackUrl,

                    @return = settings.ReturnUrl
                },
                ct
            );

            var transactionReference = ReadString(
                reply.RootElement,
                "tran_ref"
            );

            var redirectUrl = ReadString(
                reply.RootElement,
                "redirect_url"
            );

            // =========================
            // Validate Checkout Response
            // =========================

            if (string.IsNullOrWhiteSpace(
                    transactionReference) ||
                transactionReference.Length > 128 ||
                !Uri.TryCreate(
                    redirectUrl,
                    UriKind.Absolute,
                    out var redirectUri) ||
                redirectUri.Scheme != Uri.UriSchemeHttps ||
                !string.Equals(
                    redirectUri.Host,
                    "secure-jordan.paytabs.com",
                    StringComparison.OrdinalIgnoreCase) ||
                !string.IsNullOrEmpty(
                    redirectUri.UserInfo))
            {
                throw new InvalidOperationException(
                    "Invalid PayTabs checkout response.");
            }

            // =========================
            // Save Gateway Reference
            // =========================

            var saved = await _db.Payments
                .Where(p =>
                    p.Id == payment.Id &&
                    p.CheckoutStatus == "Initializing" &&
                    p.GatewayTransactionReference == null)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(
                            p => p.GatewayTransactionReference,
                            transactionReference)
                        .SetProperty(
                            p => p.CheckoutStatus,
                            "Ready"),
                    ct
                );

            if (saved != 1)
            {
                throw new InvalidOperationException(
                    "Checkout reference could not be saved.");
            }

            return redirectUrl!;
        }
        catch
        {
            // Do not automatically create another
            // checkout when the remote result is unknown.

            await _db.Payments
                .Where(p =>
                    p.Id == payment.Id &&
                    p.CheckoutStatus == "Initializing" &&
                    p.GatewayTransactionReference == null)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(
                            p => p.CheckoutStatus,
                            "NeedsReconciliation"),
                    CancellationToken.None
                );

            throw;
        }
    }

    // =========================
    // Confirm Payment
    // =========================

    public async Task<bool> ConfirmAsync(
        string transactionReference,
        CancellationToken ct)
    {
        var settings = Settings();

        if (string.IsNullOrWhiteSpace(
                transactionReference) ||
            transactionReference.Length > 128)
        {
            return false;
        }

        // Query PayTabs directly.
        // Never trust callback status alone.

        using var reply = await SendAsync(
            "/payment/query",
            new
            {
                profile_id = settings.ProfileId,
                tran_ref = transactionReference
            },
            ct
        );

        var root = reply.RootElement;

        // =========================
        // Validate Cart ID
        // =========================

        var cartId = ReadString(
            root,
            "cart_id"
        );

        if (string.IsNullOrWhiteSpace(cartId) ||
            !cartId.StartsWith(
                CartPrefix,
                StringComparison.Ordinal) ||
            !int.TryParse(
                cartId[CartPrefix.Length..],
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out var paymentId) ||
            paymentId <= 0)
        {
            return false;
        }

        // =========================
        // Load Payment
        // =========================

        var payment = await _db.Payments
            .AsNoTracking()
            .SingleOrDefaultAsync(
                p => p.Id == paymentId,
                ct
            );

        if (payment == null)
        {
            return false;
        }

        if (!string.Equals(
                payment.PaymentProvider,
                "PayTabs",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // =========================
        // Validate Stored Reference
        // =========================

        if (string.IsNullOrWhiteSpace(
                payment.GatewayTransactionReference) ||
            !string.Equals(
                payment.GatewayTransactionReference,
                transactionReference,
                StringComparison.Ordinal))
        {
            return false;
        }

        // =========================
        // Validate PayTabs Reference
        // =========================

        if (!string.Equals(
                ReadString(root, "tran_ref"),
                transactionReference,
                StringComparison.Ordinal))
        {
            return false;
        }

        // =========================
        // Validate Profile If Present
        // =========================

        var responseProfile =
            ReadString(root, "profile_id") ??
            ReadString(root, "profileId");

        if (!string.IsNullOrWhiteSpace(
                responseProfile) &&
            responseProfile !=
                settings.ProfileId.ToString(
                    CultureInfo.InvariantCulture))
        {
            return false;
        }

        // =========================
        // Validate Transaction Type
        // =========================

        if (!string.Equals(
                ReadString(root, "tran_type"),
                "Sale",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // =========================
        // Validate Currency
        // =========================

        if (!string.Equals(
                ReadString(root, "cart_currency"),
                payment.Currency,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // =========================
        // Validate Amount
        // =========================

        var amountText = ReadString(
            root,
            "cart_amount"
        );

        if (!decimal.TryParse(
                amountText,
                NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture,
                out var amount) ||
            amount != payment.Amount)
        {
            return false;
        }

        // =========================
        // Validate Payment Result
        // =========================

        if (!root.TryGetProperty(
                "payment_result",
                out var paymentResult) ||
            paymentResult.ValueKind !=
                JsonValueKind.Object)
        {
            return false;
        }

        var responseStatus = ReadString(
            paymentResult,
            "response_status"
        );

        if (!string.Equals(
                responseStatus,
                "A",
                StringComparison.Ordinal))
        {
            return false;
        }

        // =========================
        // Already Paid
        // =========================

        if (string.Equals(
                payment.Status,
                "Paid",
                StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(
                payment.TransactionId,
                transactionReference,
                StringComparison.Ordinal);
        }

        // =========================
        // Require Pending
        // =========================

        if (!string.Equals(
                payment.Status,
                "Pending",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // =========================
        // Activate Purchased Courses
        // =========================

        await _payments.MarkAsPaidAsync(
            paymentId,
            new CompletePaymentDto
            {
                TransactionId = transactionReference
            }
        );

        return true;
    }
}
