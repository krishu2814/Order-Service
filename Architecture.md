                    ORDER_CREATED
                         │
                         ▼
                 Inventory Service
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼

INVENTORY_RESERVED INVENTORY_FAILED
│ │
▼ ▼
READY_FOR_PAYMENT CANCELLED
│
▼
Payment Service
│
▼
PAYMENT_SUCCESS
│
▼
Order Service
│
▼
CONFIRMED
│
▼
ORDER_CONFIRMED
│
▼
Inventory Service
│
▼
Reservation CONFIRMED
