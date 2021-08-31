class FineCalculator:
    def __init__(self):
        pass

    def calculate_fine(self, excess_speed):
        fine = 9 # Default administration costs

        if excess_speed < 5:
            fine += 18
        elif excess_speed < 10:
            fine += 31
        elif excess_speed < 15:
            fine += 64
        elif excess_speed < 20:
            fine += 121
        elif excess_speed < 25:
            fine += 174
        elif excess_speed < 30:
            fine += 232
        elif excess_speed < 35:
            fine += 297
        elif excess_speed == 35:
            fine += 372
        else:
            return -1
        
        return fine
            