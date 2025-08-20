import dash
from dash import dcc, html
import plotly.express as px
import pandas as pd
import dash_bootstrap_components as dbc

# Load customer data
customer_df = pd.read_csv('data/customer_data.csv')
customer_df['signup_date'] = pd.to_datetime(customer_df['signup_date'])

def create_layout():
    """Customer Analytics Dashboard Layout"""
    # Age distribution
    age_fig = px.histogram(customer_df, x='age', nbins=20, 
                          title="Customer Age Distribution")
    
    # Spending by location
    location_spending = customer_df.groupby('location')['total_spent'].sum().reset_index()
    location_fig = px.bar(location_spending, x='location', y='total_spent',
                         title="Total Spending by Location")
    
    # Gender split
    gender_fig = px.pie(customer_df, names='gender', 
                       title="Customer Gender Distribution")
    
    return dbc.Container([
        html.H3("Customer Analytics Dashboard", className="mb-4"),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=age_fig)], width=6),
            dbc.Col([dcc.Graph(figure=gender_fig)], width=6)
        ]),
        dbc.Row([
            dbc.Col([dcc.Graph(figure=location_fig)], width=12)
        ]),
        dbc.Row([
            dbc.Col([
                html.H5("Key Metrics"),
                html.P(f"Total Customers: {len(customer_df):,}"),
                html.P(f"Average Spending: ${customer_df['total_spent'].mean():.2f}"),
                html.P(f"Average Age: {customer_df['age'].mean():.1f} years")
            ])
        ])
    ])