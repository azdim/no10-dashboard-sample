import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
from urllib.parse import urlparse, parse_qs

from app.dashboards import customer_analytics, sales_dashboard, financial_reports
from app.database import db_manager

# Initialize Dash app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "Analytics Platform - Sample Dashboard"

# Expose Flask server for production deployment
server = app.server

# Layout
app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    dcc.Store(id='user-session', data={'authenticated': False, 'user': None}, storage_type='session'),
    html.Div(id='page-content')
])

def create_navbar():
    """Create navigation bar"""
    return dbc.NavbarSimple(
        children=[
            dbc.NavItem(dbc.NavLink("Home", href="/", external_link=True)),
            dbc.Button("Logout", id="logout-btn", color="outline-light", size="sm", className="ms-2")
        ],
        brand="Analytics Platform",
        brand_href="/",
        color="primary",
        dark=True,
        className="mb-4"
    )

def create_home_layout():
    """Create the home page with navigation"""
    return html.Div([
        create_navbar(),
        dbc.Container([
            # Header
            dbc.Row([
                dbc.Col([
                    html.H1("Dashboard Overview", className="text-center mb-4"),
                    html.Hr()
                ])
            ]),
        
        # Navigation cards
        dbc.Row([
            dbc.Col([
                html.H3("Available Dashboards", className="text-center mb-4"),
                dbc.Row([
                    dbc.Col([
                        dbc.Card([
                            dbc.CardBody([
                                html.H5("Customer Analytics", className="card-title"),
                                html.P("Analyze customer demographics, spending patterns, and behavior insights.", className="card-text"),
                                dbc.Button("View Dashboard", href="/customer-analytics", color="primary", external_link=True)
                            ])
                        ])
                    ], width=4),
                    dbc.Col([
                        dbc.Card([
                            dbc.CardBody([
                                html.H5("Sales Dashboard", className="card-title"),
                                html.P("Track sales performance, revenue trends, and regional analysis.", className="card-text"),
                                dbc.Button("View Dashboard", href="/sales-dashboard", color="success", external_link=True)
                            ])
                        ])
                    ], width=4),
                    dbc.Col([
                        dbc.Card([
                            dbc.CardBody([
                                html.H5("Financial Reports", className="card-title"),
                                html.P("Monitor financial performance, budgets, and profit analysis.", className="card-text"),
                                dbc.Button("View Dashboard", href="/financial-reports", color="info", external_link=True)
                            ])
                        ])
                    ], width=4)
                ], className="g-4")
            ])
        ])
        ], fluid=True)
    ])

def create_auth_layout():
    """Create the authentication layout"""
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H1("Analytics Platform", className="text-center mb-4"),
                html.Hr()
            ])
        ]),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("Login Required"),
                    dbc.CardBody([
                        dbc.InputGroup([
                            dbc.InputGroupText("Username"),
                            dbc.Input(id="username", type="text", placeholder="Enter username")
                        ], className="mb-2"),
                        dbc.InputGroup([
                            dbc.InputGroupText("Password"),
                            dbc.Input(id="password", type="password", placeholder="Enter password")
                        ], className="mb-3"),
                        dbc.Button("Login", id="login-btn", color="primary", className="w-100"),
                        html.Div(id="login-status", className="mt-2")
                    ])
                ], style={'max-width': '400px', 'margin': '0 auto'})
            ])
        ])
    ], fluid=True)

# Main callback for URL routing
@app.callback(
    Output('page-content', 'children'),
    [Input('url', 'pathname')],
    [State('user-session', 'data')]
)
def display_page(pathname, session_data):
    # Check authentication first
    if not session_data.get('authenticated'):
        return create_auth_layout()
    
    user = session_data.get('user')
    user_permissions = db_manager.get_user_permissions(user)
    
    # Route to appropriate page
    if pathname == '/' or pathname is None:
        return create_home_layout()
    elif pathname == '/customer-analytics':
        if 'customer-analytics' not in user_permissions:
            return create_access_denied_page('Customer Analytics')
        return html.Div([create_navbar(), customer_analytics.create_layout()])
    elif pathname == '/sales-dashboard':
        if 'sales-dashboard' not in user_permissions:
            return create_access_denied_page('Sales Dashboard')
        return html.Div([create_navbar(), sales_dashboard.create_layout()])
    elif pathname == '/financial-reports':
        if 'financial-reports' not in user_permissions:
            return create_access_denied_page('Financial Reports')
        return html.Div([create_navbar(), financial_reports.create_layout()])
    else:
        return create_404_page()

def create_access_denied_page(dashboard_name):
    """Create access denied page"""
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H3("Access Denied", className="text-center mb-4"),
                dbc.Alert(
                    f"You don't have permission to access {dashboard_name}. Please contact your administrator.",
                    color="warning"
                ),
                dbc.Button("Return Home", href="/", color="primary", external_link=True, className="mt-3")
            ])
        ])
    ], fluid=True)

def create_404_page():
    """Create 404 page"""
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H3("Page Not Found", className="text-center mb-4"),
                dbc.Alert("The page you're looking for doesn't exist.", color="danger"),
                dbc.Button("Return Home", href="/", color="primary", external_link=True, className="mt-3")
            ])
        ])
    ], fluid=True)

# Authentication callback
@app.callback(
    Output('user-session', 'data'),
    Output('login-status', 'children'),
    Output('url', 'pathname'),
    [Input('login-btn', 'n_clicks')],
    [State('username', 'value'),
     State('password', 'value'),
     State('url', 'pathname')]
)
def authenticate_user(n_clicks, username, password, current_path):
    if not n_clicks:
        return {'authenticated': False, 'user': None}, "", current_path
    
    if not username or not password:
        return (
            {'authenticated': False, 'user': None},
            dbc.Alert("Please enter both username and password", color="warning", dismissable=True),
            current_path
        )
    
    user = db_manager.authenticate_user(username, password)
    if user:
        return {'authenticated': True, 'user': username}, "", "/"
    else:
        return (
            {'authenticated': False, 'user': None},
            dbc.Alert("Invalid credentials", color="danger", dismissable=True),
            current_path
        )

# Logout callback
@app.callback(
    [Output('user-session', 'data', allow_duplicate=True),
     Output('url', 'pathname', allow_duplicate=True)],
    [Input('logout-btn', 'n_clicks')],
    prevent_initial_call=True
)
def logout_user(n_clicks):
    if n_clicks:
        return {'authenticated': False, 'user': None}, "/"
    return dash.no_update, dash.no_update

if __name__ == '__main__':
    app.run_server(debug=True, host='0.0.0.0', port=8050)